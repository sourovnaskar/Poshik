const Pet = require("../models/petModel");
const User = require("../models/userModel");
const cloudinary = require("../config/cloudinary");
const fs = require("fs/promises");
class PetController {
  //Pet - Owner Dashboard
  async renderDashboard(req, res) {
    const loggedUser = req.user;
    const userPets = await Pet.find({ owner: loggedUser.id });
    res.render("petOwner/dashboard", {
      user: loggedUser,
      petsCount: userPets.length,
      pets: userPets,
      activeOrdersCount: 0,
      upcomingAppointmentsCount: 0,
      recentOrders: [],
      upcomingAppointments: [],
    });
  }

  //To view Owner profile
  async renderOwnerProfile(req, res) {
    try {
      const loggedUser = req.user;
      res.render("petOwner/owner-details", {
        user: loggedUser,
        title: "My Profile",
      });
    } catch (error) {
      console.error("Profile Render Error: ", error.message);
      res.redirect("/owner/dashboard");
    }
  }

  //To view Add-pet form & addPet
  renderAddPet(req, res) {
    const loggedUser = req.user;
    res.render("petOwner/addPet", { user: loggedUser });
  }
  async createPet(req, res) {
    try {
      const id = req.user.id;
      const {
        name,
        species,
        breed,
        gender,
        age,
        weight,
        color,
        bio,
        vaccinationDetails,
        medicalHistory,
      } = req.body;

      const existPet = await Pet.findOne({ owner: id, name, species });
      if (existPet) {
        req.flash("error", "Pet Already Exist");

        if (req.file) {
          await fs
            .unlink(req.file.path)
            .catch((err) => console.error("File deletion Error :", err));
        }

        return res.redirect("/api/pet/create");
      }

      let imageurl = null;
      if (req.file) {
        const petImage = await cloudinary.uploader.upload(req.file.path, {
          folder: "Poshik/Pet",
        });
        imageurl = petImage.secure_url;
        await fs
          .unlink(req.file.path)
          .catch((err) => console.error("File deletion Error :", err));
      }

      const pet = new Pet({
        owner: id,
        name,
        species,
        breed,
        gender,
        age,
        weight,
        color,
        image: imageurl,
        bio,
        vaccinationDetails,
        medicalHistory,
      });
      await pet.save();
      return res.redirect("/api/pet/dashboard");
    } catch (error) {
      console.error("Not Add Pet : ", error.message);
      if (req.file) {
        await fs
          .unlink(req.file.path)
          .catch((err) => console.error("File deletion Error :", err));
      }
      req.flash("error", "Something Went wrong , Please try Again ");
      return res.redirect("/api/pet/create");
    }
  }

  //Details of the pet
  async detailsPet(req, res) {
    try {
      const loggedUser = req.user;
      const id = req.params.id;
      const petDetails = await Pet.findById(id);
      res.render("petOwner/pet-details", { petDetails, user: loggedUser });
    } catch (error) {
      console.error("Not Add Pet : ", error.message);
      req.flash("error", "Something Went wrong to fetch Pet Details  ");
      return res.redirect("/api/pet/dashboard");
    }
  }

  //View Pet edit page & update details
  async renderEditPet(req, res) {
    try {
      const id = req.params.id;
      const loggedUser = req.user;
      const userId = loggedUser.id;

      const petDetails = await Pet.findOne({ _id: id, owner: userId });

      if (!petDetails) {
        req.flash("error", "Pet not found or unauthorized access.");
        return res.redirect("/api/pet/dashboard");
      }
      res.render("petOwner/edit-pet", {
        user: loggedUser,
        pet: petDetails,
        title: "Edit Pet Profile",
      });
    } catch (error) {
      console.error("Render Edit Pet Error: ", error.message);
      req.flash("error", "Something went wrong loading the edit page.");
      res.redirect("/api/pet/dashboard");
    }
  }
  async updatePetDetails(req, res) {
    try {
      const id = req.params.id;
      const loggedUser = req.user;
      const userId = loggedUser.id;

      const {
        name,
        species,
        breed,
        gender,
        age,
        weight,
        color,
        bio,
        vaccinationDetails,
        medicalHistory,
      } = req.body;

      const existPet = await Pet.findOne({ _id: id, owner: userId });
      if (!existPet) {
        if (req.file) {
          await fs.unlink(req.file.path).catch((err) => console.error(err));
        }
        req.flash("error", "Pet not found or unauthorized to update.");
        return res.redirect("/api/pet/dashboard");
      }

      const newDetails = {};
      if (name) newDetails.name = name;
      if (species) newDetails.species = species;
      if (breed) newDetails.breed = breed;
      if (gender) newDetails.gender = gender;
      if (age) newDetails.age = age;
      if (weight) newDetails.weight = weight;
      if (color) newDetails.color = color;
      if (bio) newDetails.bio = bio;
      if (vaccinationDetails)
        newDetails.vaccinationDetails = vaccinationDetails;
      if (medicalHistory) newDetails.medicalHistory = medicalHistory;

      if (req.file) {
        if (existPet.image) {
          try {
            const oldImageUrl = existPet.image;

            const parts = oldImageUrl.split("/");

            const folderIndex = parts.indexOf("Poshik");

            if (folderIndex !== -1) {
              let publicId = parts.slice(folderIndex).join("/");

              publicId = publicId.substring(0, publicId.lastIndexOf("."));

              const deleteResponse =
                await cloudinary.uploader.destroy(publicId);
              console.log("Cloudinary Deletion Response:", deleteResponse);
            }
          } catch (cloudinaryErr) {
            console.error(
              "Error deleting old image from Cloudinary:",
              cloudinaryErr,
            );
          }
          const petImage = await cloudinary.uploader.upload(req.file.path, {
            folder: "Poshik/Pet",
          });
          newDetails.image = petImage.secure_url;

          await fs
            .unlink(req.file.path)
            .catch((err) => console.error("File deletion Error :", err));
        }
      }

      await Pet.findByIdAndUpdate(id, { $set: newDetails }, { new: true });

      req.flash("success", "Pet profile updated successfully!");

      return res.redirect(`/api/pet/profile/${id}`);
    } catch (error) {
      console.error("Update Pet Error: ", error.message);

      if (req.file) {
        await fs
          .unlink(req.file.path)
          .catch((err) => console.error("File deletion Error :", err));
      }

      req.flash(
        "error",
        "Something went wrong while updating the pet profile.",
      );
      return res.redirect(`/api/pet/edit/${req.params.id}`);
    }
  }

  //To view Mypets
  async myPet(req, res) {
    try {
      const loggedUser = req.user;
      const userId = loggedUser.id;

      const page = parseInt(req.query.page) || 1;
      const limit = 6;
      const skip = (page - 1) * limit;

      const allPets = await Pet.find({ owner: userId })
        .sort({
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit);

      const totalPetsCount = await Pet.countDocuments({ owner: userId });
      const totalPages = Math.ceil(totalPetsCount / limit);

      res.render("petOwner/my-pets", {
        user: loggedUser,
        pets: allPets,
        title: "My Pets",
        currentPage: page,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      });
    } catch (error) {
      console.error("Render My Pets Error: ", error.message);
      req.flash("error", "Unable to load your pets.");
      res.redirect("/api/pet/dashboard");
    }
  }
}

module.exports = new PetController();
