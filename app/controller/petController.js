const Pet = require("../models/petModel");
const User = require("../models/userModel");
const Appointment = require("../models/appointmentModel");
const DoctorSchedule = require("../models/doctorScheduleModel");
const Doctor = require("../models/doctorModel");
const Shop = require("../models/shopModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Cart = require("../models/cartModel");

const mongoose = require("mongoose");
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

  async getMyAppointments(req, res) {
    try {
      // Aggregation requires object IDs to be explicitly casted
      const userId = new mongoose.Types.ObjectId(req.user.id);

      const appointments = await Appointment.aggregate([
        // Find only appointments belonging to the logged-in pet owner
        {
          $match: { owner: userId },
        },

      // Join the Pet collection to get the pet's name/details
        {
          $lookup: {
            from: "pets",
            localField: "pet",
            foreignField: "_id",
            as: "petDetails",
          },
        },
        
        { $unwind: "$petDetails" },

        //  Join the Doctor collection to get specialization & clinic address
        {
          $lookup: {
            from: "doctors",
            localField: "doctor",
            foreignField: "_id",
            as: "doctorProfile",
          },
        },
        { $unwind: "$doctorProfile" },

        //  Join the User collection to get the Doctor's actual Name
        
        {
          $lookup: {
            from: "users",
            localField: "doctorProfile.user",
            foreignField: "_id",
            as: "doctorUser",
          },
        },
        { $unwind: "$doctorUser" },

        //Join the DoctorSchedule to get shift timings (startTime, endTime)
        {
          $lookup: {
            from: "doctorschedules", // Default plural of DoctorSchedule
            localField: "schedule",
            foreignField: "_id",
            as: "scheduleDetails",
          },
        },
        { $unwind: "$scheduleDetails" },

        //Order by upcoming dates first
        {
          $sort: { appointmentDate: 1 },
        },

        // Clean up the output so we only send necessary data to EJS
        {
          $project: {
            _id: 1,
            tokenNumber: 1,
            appointmentDate: 1,
            reason: 1,
            status: 1,
            consultationFee: 1,
            "petDetails.name": 1,
            "doctorUser.name": 1,
            "doctorProfile.specialization": 1,
            "doctorProfile.clinicAddress": 1,
            "scheduleDetails.startTime": 1,
            "scheduleDetails.endTime": 1,
          },
        },
      ]);

      
      res.render("petOwner/appointments", {
        user: req.user,
        appointments: appointments,
      });
    } catch (error) {
      console.error("Aggregation Error fetching appointments:", error);
      req.flash("error", "Failed to load your appointments.");
      return res.redirect("/api/user/dashboard");
    }
  }

  async getDoctorsDirectory(req, res) {
    try {
      const userId = req.user.id;

      // Get today's date at midnight to filter out past shifts
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Run all three database queries CONCURRENTLY for maximum performance
      const [doctors, pets, schedules] = await Promise.all([
        // 1. Fetch all doctors and populate their real name from the User collection
        Doctor.find({}).populate("user", "name"),

        // 2. Fetch only the pets belonging to the currently logged-in user
        Pet.find({ owner: userId }),

        // 3. Fetch all upcoming schedules (ignore past dates)
        DoctorSchedule.find({ date: { $gte: today } }).sort({
          date: 1,
          startTime: 1,
        }),
      ]);

      // Render the EJS page and pass the three arrays to the frontend
      res.render("petOwner/book-doctor", {
        user: req.user,
        doctors: doctors,
        pets: pets,
        schedules: schedules,
      });
    } catch (error) {
      console.error("Error fetching doctors directory:", error);
      req.flash("error", "Could not load the booking directory at this time.");
      return res.redirect("/api/user/dashboard");
    }
  }

  async bookAppointment(req, res) {
    try {
      const userId = req.user.id; 

      
      const { doctorId, scheduleId, petId, reason } = req.body;

      
      if (!doctorId || !scheduleId || !petId || !reason) {
        req.flash("error", "All fields are required to book an appointment.");
        return res.redirect("back"); 
      }

     
      const schedule = await DoctorSchedule.findById(scheduleId);
      const doctor = await Doctor.findById(doctorId);

      if (!schedule || !doctor) {
        req.flash("error", "Invalid schedule or doctor selected.");
        return res.redirect("/api/pet/view/book-doctor");
      }

    
      if (schedule.bookedCount >= schedule.maxPatients) {
        req.flash(
          "error",
          "Sorry, this shift is fully booked. Please select another time.",
        );
        return res.redirect("/api/pet/view/book-doctor");
      }

      
      const updatedSchedule = await DoctorSchedule.findByIdAndUpdate(
        scheduleId,
        { $inc: { bookedCount: 1 } },
        { new: true }, 
      );

      const generatedTokenNumber = updatedSchedule.bookedCount;

      
      const newAppointment = new Appointment({
        owner: userId,
        pet: petId,
        doctor: doctorId,
        schedule: scheduleId,
        tokenNumber: generatedTokenNumber, 
        appointmentDate: schedule.date,
        reason: reason,
        consultationFee: doctor.consultationFee, 
        status: "Confirmed",
      });

      await newAppointment.save();

      req.flash(
        "success",
        `Appointment Confirmed! You are Token #${generatedTokenNumber}`,
      );

     
      return res.redirect("/api/pet/view/book-doctor");
    } catch (error) {
      console.error("Booking Error:", error);

      
      if (error.code === 11000) {
        req.flash(
          "error",
          "You have already booked an appointment for this pet in this shift.",
        );
      } else {
        req.flash(
          "error",
          "An error occurred while booking. Please try again.",
        );
      }

      return res.redirect("back");
    }
  }

  async petShop(req, res) {
    try {
      const loggedUser = req.user;

      const page = parseInt(req.query.page) || 1;
      const limit = 9;
      const skip = (page - 1) * limit;
      const searchQuery = req.query.search || "";

      const query = { isActive: true };

      if (searchQuery) {
        query.shopName = { $regex: searchQuery, $options: "i" };
      }

      const totalShops = await Shop.countDocuments(query);
      const totalPages = Math.ceil(totalShops / limit);

      const availablePetshop = await Shop.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.render("petOwner/pet-shop", {
        user: loggedUser,
        shops: availablePetshop,
        searchQuery: searchQuery,
        currentPage: page,
        totalPages: totalPages,
      });
    } catch (error) {
      console.error("Pet Shop Directory Error: ", error.message);
      req.flash(
        "error",
        "Something went wrong. Please try again after some time.",
      );
      return res.redirect("/api/pet/dashboard");
    }
  }

  async products(req, res) {
    try {
      const loggedUser = req.user;
      const shopId = req.params.id;
      const selectedCategoryId = req.query.category;

      const shopDetails = await Shop.findById(shopId);

      if (!shopDetails) {
        req.flash("error", "Shop not found or is no longer active.");
        return res.redirect("/api/user/shops");
      }
      const categories = await Category.find({ shop: shopId, isActive: true });

      const productQuery = { shop: shopId, isActive: true };

      // If the user clicked a specific category, filter the products!
      if (selectedCategoryId) {
        productQuery.category = selectedCategoryId;
      }

      const products = await Product.find(productQuery)
        .populate("shop", "shopName logo")
        .populate("category", "name")
        .sort({ createdAt: -1 });

      res.render("petOwner/products", {
        user: loggedUser,
        products: products,
        shop: shopDetails,
        categories: categories,
        selectedCategoryId: selectedCategoryId,
      });
    } catch (error) {
      console.error("View Shop Products Error: ", error);
      req.flash("error", "Something went wrong while loading the shop.");
      return res.redirect("/api/user/shops");
    }
  }

  // 1. Attempt to add item to cart
  async addToCart(req, res) {
    try {
      const userId = req.user.id;
      const { productId, shopId } = req.body;

      
      let cart = await Cart.findOne({ user: userId });
      if (!cart) {
        cart = new Cart({ user: userId, items: [], activeShop: null });
      }

      
      if (
        cart.activeShop &&
        cart.activeShop.toString() !== shopId &&
        cart.items.length > 0
      ) {
       
        return res.status(409).json({
          conflict: true,
          message:
            "Your cart contains items from a different shop. Do you want to clear your cart and add this item instead?",
        });
      }

 
      cart.activeShop = shopId; 

      
      const existingItemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId,
      );
      if (existingItemIndex > -1) {
        cart.items[existingItemIndex].quantity += 1;
      } else {
        cart.items.push({ product: productId, quantity: 1 });
      }

      await cart.save();
      return res
        .status(200)
        .json({ success: true, message: "Item added to cart!" });
    } catch (error) {
      console.error("Cart Add Error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }

  // Forcefully replace the cart (User clicked "Yes" on modal)
  async replaceCart(req, res) {
    try {
      const userId = req.user.id;
      const { productId, shopId } = req.body;

      let cart = await Cart.findOne({ user: userId });

      // Overwrite the old cart data entirely
      cart.activeShop = shopId;
      cart.items = [{ product: productId, quantity: 1 }];

      await cart.save();
      return res
        .status(200)
        .json({ success: true, message: "Cart replaced and item added!" });
    } catch (error) {
      console.error("Cart Replace Error:", error);
      return res.status(500).json({ success: false, message: "Server error" });
    }
  }
  // View Cart Page
  async viewCart(req, res) {
    try {
      const userId = req.user.id;
      const loggedUser = req.user;

     
      const cart = await Cart.findOne({ user: userId })
        .populate("activeShop", "shopName logo")
        .populate({
          path: "items.product",
          select: "name price images stock" 
        });

      // Render the EJS template and pass the data
      res.render("petOwner/cart", {
        user: loggedUser,
        cart: cart // EJS will handle it gracefully if cart is null
      });

    } catch (error) {
      console.error("View Cart Error:", error);
      req.flash("error", "Something went wrong while loading your cart.");
      res.redirect("/api/pet/view/shop");
    }
  }
}

module.exports = new PetController();
