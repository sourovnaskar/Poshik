const Shop = require("../models/shopModel");
const Kyc = require("../models/kycModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const cloudinary = require("../config/cloudinary");
const fs = require("fs/promises");
const User = require("../models/userModel");
class ShopController {
  async renderDashboard(req, res) {
    const loggedUser = req.user;
    const userId = loggedUser.id;

    const shopProfile = await Shop.findOne({ owner: userId });

    const totalProducts = await Product.countDocuments({shop:shopProfile._id});

    const hasProfile = shopProfile ? true : false;
    res.render("shop/dashboard", {
      user: loggedUser,
      hasProfile: hasProfile,
      shop: shopProfile,
      totalProducts: totalProducts,
    });
  }

  async renderKycForm(req, res) {
    const loggedUser = req.user;
    res.render("shop/kyc-submit", { user: loggedUser });
  }

  async submitKyc(req, res) {
    let uploadedCloudinaryIds = [];
    try {
      const userId = req.user.id;

      const currentUser = await User.findById(userId);

      if (
        currentUser.kycStatus === "Pending" ||
        currentUser.kycStatus === "Approved"
      ) {
        if (req.files) {
          Object.values(req.files).forEach(async (fileArray) => {
            try {
              await fs.unlink(fileArray[0].path);
            } catch (err) {}
          });
        }

        req.flash(
          "error",
          "You already have a KYC application submitted. Please wait for admin review.",
        );
        return res.redirect("/api/shop/dashboard");
      }

      const { idType, addressProofType } = req.body;

      const files = req.files;

      if (!files || !files.idProof || !files.addressProof) {
        req.flash("error", "ID Proof and Address Proof are mandatory!");
        return res.redirect("/api/shop/kyc/form");
      }

      let uploadedUrls = {
        idProof: "",
        addressProof: "",
        license: null,
        certificate: null,
      };

      const uploadToCloudinary = async (fileArray) => {
        const file = fileArray[0];
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "Poshik/KYC-Documents/Shop",
        });

        uploadedCloudinaryIds.push(result.public_id);
        await fs.unlink(file.path); // Delete local temp file immediately after upload
        return result.secure_url;
      };

      uploadedUrls.idProof = await uploadToCloudinary(files.idProof);
      uploadedUrls.addressProof = await uploadToCloudinary(files.addressProof);

      if (files.license) {
        uploadedUrls.license = await uploadToCloudinary(files.license);
      }
      if (files.certificate) {
        uploadedUrls.certificate = await uploadToCloudinary(files.certificate);
      }

      const kycDocument = new Kyc({
        user: userId,
        idType: idType,
        idProof: uploadedUrls.idProof,
        addressProofType: addressProofType,
        addressProof: uploadedUrls.addressProof,
        license: uploadedUrls.license,
        certificate: uploadedUrls.certificate,
      });

      await kycDocument.save();

      await User.findByIdAndUpdate(userId, {
        kycStatus: "Pending",
      });
      req.flash("success", "KYC Documents submitted successfully for review!");
      return res.redirect("/api/shop/dashboard");
    } catch (error) {
      console.error(error.message);

      //Delete successfully uploaded images from Cloudinary
      if (uploadedCloudinaryIds.length > 0) {
        for (const publicId of uploadedCloudinaryIds) {
          try {
            await cloudinary.uploader.destroy(publicId);
            console.log(
              `Rollback: Deleted orphaned Cloudinary image: ${publicId}`,
            );
          } catch (cloudinaryErr) {
            console.error(
              `Failed to delete Cloudinary image: ${publicId}`,
              cloudinaryErr.message,
            );
          }
        }
      }

      if (req.files) {
        Object.values(req.files).forEach(async (fileArray) => {
          try {
            await fs.unlink(fileArray[0].path);
          } catch (err) {
            // Ignore ENOENT errors if already deleted
          }
        });
      }

      req.flash("error", "Something Error Occured , Please try Again !");
      return res.redirect("/api/shop/kyc/form");
    }
  }

  async createShopDetails(req, res) {
    try {
      const loggedUser = req.user;
      return res.render("shop/shop-setup", {
        user: loggedUser,
      });
    } catch (error) {
      console.error(error.message);
      return req.flash("error", "Something error Ocuured");
    }
  }

  async submitDetails(req, res) {
    try {
      const loggeduser = req.user;

      const { shopName, description, phone, address } = req.body;

      const existingShop = await Shop.findOne({ owner: loggeduser.id });
      if (existingShop) {
        req.flash("error", "You Already Have a Shop");
        return res.redirect("/api/shop/dashboard");
      }
      let shopImg = null;
      if (req.file) {
        const img = await cloudinary.uploader.upload(req.file.path, {
          folder: "Poshik/Shop",
        });
        shopImg = img.secure_url;
        await fs.unlink(req.file.path);
      }

      const details = new Shop({
        owner: loggeduser.id,
        shopName,
        description,
        phone,
        address,
        logo: shopImg,
      });
      await details.save();

      return res.redirect("/api/shop/dashboard");
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path);
      }

      req.flash("error", "Something Error Occured , Please try Again !");
      return res.redirect("/api/shop/details/form");
    }
  }

  // Category Related

  async renderAddCategory(req, res) {
    try {
      res.render("shop/add-category", { user: req.user });
    } catch (error) {
      console.error(error);
      res.redirect("/api/shop/dashboard");
    }
  }

  async createCategory(req, res) {
    let uploadedCloudinaryId = null;

    try {
      const userId = req.user.id;
      const { name } = req.body;

      const shop = await Shop.findOne({ owner: userId });
      if (!shop) {
        req.flash("error", "Shop profile not found.");
        return res.redirect("/api/shop/dashboard");
      }

      const existingCategory = await Category.findOne({
        shop: shop._id,
        name: name.trim(),
      });
      if (existingCategory) {
        if (req.file) await fs.unlink(req.file.path).catch(() => {});
        req.flash("error", `You already have a category named "${name}".`);
        return res.redirect("/api/shop/categories/add");
      }

      let categoryImg = null;
      if (req.file) {
        const img = await cloudinary.uploader.upload(req.file.path, {
          folder: "Poshik/Categories",
        });
        categoryImg = img.secure_url;
        uploadedCloudinaryId = img.public_id;
        await fs.unlink(req.file.path).catch(() => {});
      }

      // 4. Save the Category
      const newCategory = new Category({
        shop: shop._id,
        name: name.trim(),
        image: categoryImg,
      });

      await newCategory.save();

      req.flash("success", "Category created successfully!");
      return res.redirect("/api/shop/dashboard"); // Or redirect to a 'View Categories' page
    } catch (error) {
      console.error("Category Creation Error: ", error);

      if (uploadedCloudinaryId) {
        await cloudinary.uploader.destroy(uploadedCloudinaryId).catch(() => {});
      }
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      req.flash("error", "Failed to create category. Please try again.");
      return res.redirect("/api/shop/categories/add");
    }
  }

  // View All Categories for the Logged-in Shop
  async getCategories(req, res) {
    try {
      const userId = req.user.id;

      const page = parseInt(req.query.page) || 1;
      const limit = 8;
      const skip = (page - 1) * limit;

      // 1. Find the shop belonging to this user
      const shop = await Shop.findOne({ owner: userId });
      if (!shop) {
        req.flash("error", "Shop profile not found.");
        return res.redirect("/api/shop/dashboard");
      }

      const totalCategories = await Category.countDocuments({ shop: shop._id });
      const totalPages = Math.ceil(totalCategories / limit);

      // 2. Fetch all categories that belong to this shop
      const categories = await Category.find({ shop: shop._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // 3. Render the list view and pass the categories array
      res.render("shop/categories", {
        user: req.user,
        categories: categories,
        shop: shop,
        currentPage: page,
        totalPages: totalPages,
        totalCategories: totalCategories,
        limit: limit,
      });
    } catch (error) {
      console.error("Fetch Categories Error: ", error);
      req.flash("error", "Failed to load categories.");
      return res.redirect("/api/shop/dashboard");
    }
  }


  async renderAddProducts(req, res) {
    try {
      const userId = req.user.id;

     
      const shop = await Shop.findOne({ owner: userId });

      if (!shop) {
        req.flash("error", "Please complete your shop profile first.");
        return res.redirect("/api/shop/dashboard");
      }
      const categories = await Category.find({
        shop: shop._id,
        isActive: true, 
      }).select("_id name");
      res.render("shop/add-product", {
        user: req.user,
        categories: categories,
      });
    } catch (error) {
      console.error(error);
      res.redirect("/api/shop/dashboard");
    }
  }

  async createProduct(req, res) {
    // Keep track of uploaded images in case we need to roll back (delete them) on error
    const uploadedImages = []; 

    try {
      const userId = req.user.id;
      const { name, description, category, mrp, price, stock, isActive } = req.body;

      // 1. Authenticate Shop
      const shop = await Shop.findOne({ owner: userId });
      if (!shop) {
        req.flash("error", "Shop profile not found.");
        return res.redirect("/api/shop/dashboard");
      }

      // 2. Process Multiple Image Uploads
      if (!req.files || req.files.length === 0) {
        req.flash("error", "At least one product image is required.");
        return res.redirect("/api/shop/products/add");
      }

      for (const file of req.files) {
        // Upload each file to Cloudinary
        const result = await cloudinary.uploader.upload(file.path, {
          folder: "Poshik/Products",
        });
        
        uploadedImages.push({
          url: result.secure_url,
          public_id: result.public_id
        });

        // Delete the temporary local file stored by Multer
        await fs.unlink(file.path).catch(() => {}); 
      }

      // 3. Backend Pricing Validation & Discount Calculation
      const numMrp = Number(mrp);
      const numPrice = Number(price);
      
      if (numPrice > numMrp) {
        throw new Error("Selling price cannot be greater than MRP.");
      }

      const calculatedDiscount = Math.round(((numMrp - numPrice) / numMrp) * 100);

      // Extract just the secure URLs for the database schema
      const imageUrls = uploadedImages.map(img => img.url);

      // 4. Create and Save Product
      const newProduct = new Product({
        shop: shop._id,
        category: category,
        name: name.trim(),
        description: description ? description.trim() : "",
        mrp: numMrp,
        price: numPrice,
        discountPercentage: calculatedDiscount > 0 ? calculatedDiscount : 0,
        stock: Number(stock),
        images: imageUrls,
        // Checkboxes return 'on', 'true', or might be undefined if unchecked
        isActive: isActive === "on" || isActive === "true" || isActive === true,
      });

      await newProduct.save();

      req.flash("success", "Product successfully added to your inventory!");
      return res.redirect("/api/shop/products"); 

    } catch (error) {
      console.error("Product Creation Error: ", error);

      // 5. Rollback: Delete images from Cloudinary if the database save fails
      if (uploadedImages.length > 0) {
        for (const img of uploadedImages) {
          await cloudinary.uploader.destroy(img.public_id).catch(() => {});
        }
      }

      // Clean up any remaining local Multer files just in case
      if (req.files) {
        for (const file of req.files) {
          await fs.unlink(file.path).catch(() => {});
        }
      }

      req.flash("error", error.message || "Failed to create product. Please try again.");
      return res.redirect("/api/shop/products/add");
    }
  }

  // View All Products for the Logged-in Shop
  async getProducts(req, res) {
    try {
      const userId = req.user.id;
      
      // Pagination setup (Default to page 1, 10 items per page)
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      // 1. Find the shop belonging to this user
      const shop = await Shop.findOne({ owner: userId });
      if (!shop) {
        req.flash("error", "Shop profile not found.");
        return res.redirect("/api/shop/dashboard");
      }

      // 2. Count total products for pagination math
      const totalProducts = await Product.countDocuments({ shop: shop._id });
      const totalPages = Math.ceil(totalProducts / limit);

      // 3. Fetch paginated products and populate the category name
      const products = await Product.find({ shop: shop._id })
        .populate("category", "name") // Pulls the category name instead of just an ID
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      // 4. Render the view and pass all required variables
      res.render("shop/products", {
        user: req.user,
        shop: shop,
        products: products,
        currentPage: page,
        totalPages: totalPages,
        totalProducts: totalProducts,
        limit: limit
      });

    } catch (error) {
      console.error("Fetch Products Error:", error);
      req.flash("error", "Failed to load products.");
      return res.redirect("/api/shop/dashboard");
    }
  }
}

module.exports = new ShopController();
