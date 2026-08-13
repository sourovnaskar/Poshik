const Shop = require("../models/shopModel");
const Kyc = require("../models/kycModel");
const Category = require("../models/categoryModel");
const Product = require("../models/productModel");
const Order = require("../models/orderModel");
const cloudinary = require("../config/cloudinary");
const fs = require("fs/promises");
const User = require("../models/userModel");
const { sendOrderDeliveredEmail } = require("../utils/email/sendEmail");
class ShopController {
  async renderDashboard(req, res) {
    const loggedUser = req.user;
    const userId = loggedUser.id;

    const shopProfile = await Shop.findOne({ owner: userId });
    const hasProfile = shopProfile ? true : false;

    const totalProducts = await Product.countDocuments({ shop: shopProfile ? shopProfile._id : null });

    // Order stats for dashboard widgets
    let activeOrders = 0;
    let pendingDispatch = 0;
    let totalRevenue = "0.00";
    let recentOrders = [];

    // Chart data (real)
    let revenueData = [0, 0, 0, 0, 0, 0, 0];   // last 7 days
    let revenueLabels = [];                       // e.g. ["05 Aug", "06 Aug" ...]
    let orderStats = [0, 0, 0, 0, 0, 0];         // [Pending,Confirmed,Processing,Shipped,Delivered,Cancelled]

    // Build last-7-days labels (including today)
    const today = new Date();
    const dayLabels = [];
    const dayStarts = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      d.setHours(0, 0, 0, 0);
      dayStarts.push(new Date(d));
      dayLabels.push(
        d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
      );
    }
    revenueLabels = dayLabels;

    if (shopProfile) {
      activeOrders = await Order.countDocuments({
        shop: shopProfile._id,
        orderStatus: { $in: ["Pending", "Confirmed", "Processing", "Shipped"] },
      });

      pendingDispatch = await Order.countDocuments({
        shop: shopProfile._id,
        orderStatus: { $in: ["Pending", "Confirmed"] },
      });

      // Total revenue (delivered orders)
      const revenueAgg = await Order.aggregate([
        { $match: { shop: shopProfile._id, orderStatus: "Delivered" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]);
      totalRevenue = revenueAgg.length > 0 ? revenueAgg[0].total.toFixed(2) : "0.00";

      // ── Line Chart: Revenue per day for last 7 days ──────────────────────────
      const sevenDaysAgo = new Date(dayStarts[0]); // start of 7 days ago
      const revenueByDay = await Order.aggregate([
        {
          $match: {
            shop: shopProfile._id,
            orderStatus: "Delivered",
            createdAt: { $gte: sevenDaysAgo },
          },
        },
        {
          $group: {
            _id: {
              $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "+05:30" },
            },
            total: { $sum: "$totalAmount" },
          },
        },
      ]);

      // Map aggregation results onto the 7-day slots
      const revenueMap = {};
      revenueByDay.forEach((r) => { revenueMap[r._id] = r.total; });

      revenueData = dayStarts.map((d) => {
        const key = d.toISOString().slice(0, 10); // "YYYY-MM-DD"
        return revenueMap[key] || 0;
      });

      // ── Doughnut Chart: Count per order status ───────────────────────────────
      const statusAgg = await Order.aggregate([
        { $match: { shop: shopProfile._id } },
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
      ]);

      const statusMap = {};
      statusAgg.forEach((s) => { statusMap[s._id] = s.count; });

      // Fixed order matching the chart labels
      const statusKeys = ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled"];
      orderStats = statusKeys.map((k) => statusMap[k] || 0);

      // Recent 5 orders
      const orders = await Order.find({ shop: shopProfile._id })
        .populate("user", "name")
        .sort({ createdAt: -1 })
        .limit(5);

      recentOrders = orders.map((o) => ({
        orderId: o.orderNumber,
        _id: o._id,
        customerName: o.user ? o.user.name : "Unknown",
        amount: o.totalAmount,
        status: o.orderStatus,
      }));
    }

    res.render("shop/dashboard", {
      user: loggedUser,
      hasProfile: hasProfile,
      shop: shopProfile,
      totalProducts: totalProducts,
      activeOrders,
      pendingDispatch,
      totalRevenue,
      recentOrders,
      revenueData,
      revenueLabels,
      orderStats,
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
        return res.redirect("/shop/dashboard");
      }

      const { idType, addressProofType } = req.body;

      const files = req.files;

      if (!files || !files.idProof || !files.addressProof) {
        req.flash("error", "ID Proof and Address Proof are mandatory!");
        return res.redirect("/shop/kyc/form");
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
      return res.redirect("/shop/dashboard");
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
      return res.redirect("/shop/kyc/form");
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
        return res.redirect("/shop/dashboard");
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

      return res.redirect("/shop/dashboard");
    } catch (error) {
      if (req.file) {
        await fs.unlink(req.file.path);
      }

      req.flash("error", "Something Error Occured , Please try Again !");
      return res.redirect("/shop/details/form");
    }
  }

  // Category Related

  async renderAddCategory(req, res) {
    try {
      res.render("shop/add-category", { user: req.user });
    } catch (error) {
      console.error(error);
      res.redirect("/shop/dashboard");
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
        return res.redirect("/shop/dashboard");
      }

      const existingCategory = await Category.findOne({
        shop: shop._id,
        name: name.trim(),
      });
      if (existingCategory) {
        if (req.file) await fs.unlink(req.file.path).catch(() => {});
        req.flash("error", `You already have a category named "${name}".`);
        return res.redirect("/shop/categories/add");
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
      return res.redirect("/shop/dashboard"); // Or redirect to a 'View Categories' page
    } catch (error) {
      console.error("Category Creation Error: ", error);

      if (uploadedCloudinaryId) {
        await cloudinary.uploader.destroy(uploadedCloudinaryId).catch(() => {});
      }
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      req.flash("error", "Failed to create category. Please try again.");
      return res.redirect("/shop/categories/add");
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
        return res.redirect("/shop/dashboard");
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
      return res.redirect("/shop/dashboard");
    }
  }


  async renderAddProducts(req, res) {
    try {
      const userId = req.user.id;

     
      const shop = await Shop.findOne({ owner: userId });

      if (!shop) {
        req.flash("error", "Please complete your shop profile first.");
        return res.redirect("/shop/dashboard");
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
      res.redirect("/shop/dashboard");
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
        return res.redirect("/shop/dashboard");
      }

      // 2. Process Multiple Image Uploads
      if (!req.files || req.files.length === 0) {
        req.flash("error", "At least one product image is required.");
        return res.redirect("/shop/products/add");
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
      return res.redirect("/shop/products"); 

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
      return res.redirect("/shop/products/add");
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
        return res.redirect("/shop/dashboard");
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
      return res.redirect("/shop/dashboard");
    }
  }

  // Render edit product form
  async editProductForm(req, res) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      const shop = await Shop.findOne({ owner: userId });
      if (!shop) {
        req.flash("error", "Shop not found.");
        return res.redirect("/shop/dashboard");
      }

      const product = await Product.findOne({ _id: productId, shop: shop._id }).populate("category", "name");
      if (!product) {
        req.flash("error", "Product not found.");
        return res.redirect("/shop/all/products");
      }

      const categories = await Category.find({ shop: shop._id });

      res.render("shop/edit-product", {
        user: req.user,
        shop,
        product,
        categories,
        hasProfile: true,
      });
    } catch (error) {
      console.error("Edit Product Form Error:", error);
      req.flash("error", "Failed to load product.");
      return res.redirect("/shop/all/products");
    }
  }

  // Update a product
  async updateProduct(req, res) {
    const uploadedImages = [];
    try {
      const userId = req.user.id;
      const { productId } = req.params;
      const { name, description, mrp, price, stock, category, isActive, removeImages } = req.body;

      const shop = await Shop.findOne({ owner: userId });
      if (!shop) {
        req.flash("error", "Shop not found.");
        return res.redirect("/shop/dashboard");
      }

      const product = await Product.findOne({ _id: productId, shop: shop._id });
      if (!product) {
        req.flash("error", "Product not found.");
        return res.redirect("/shop/all/products");
      }

      const numMrp = Number(mrp);
      const numPrice = Number(price);
      if (numPrice > numMrp) {
        req.flash("error", "Selling price cannot be greater than MRP.");
        return res.redirect(`/shop/products/edit/${productId}`);
      }

      // Upload new images if provided
      if (req.files && req.files.length > 0) {
        for (const file of req.files) {
          const result = await cloudinary.uploader.upload(file.path, { folder: "poshik/products" });
          uploadedImages.push({ url: result.secure_url, public_id: result.public_id });
          await fs.unlink(file.path).catch(() => {});
        }
      }

      // Remove images the user checked to remove
      let existingImages = [...product.images];
      if (removeImages) {
        const toRemove = Array.isArray(removeImages) ? removeImages : [removeImages];
        existingImages = existingImages.filter(img => !toRemove.includes(img));
        // Try to destroy from Cloudinary (best-effort)
        for (const url of toRemove) {
          const parts = url.split("/");
          const publicId = parts.slice(-2).join("/").replace(/\.[^/.]+$/, "");
          await cloudinary.uploader.destroy(publicId).catch(() => {});
        }
      }

      const newImages = [...existingImages, ...uploadedImages.map(i => i.url)];
      if (newImages.length === 0) {
        req.flash("error", "Product must have at least one image.");
        return res.redirect(`/shop/products/edit/${productId}`);
      }

      const calculatedDiscount = Math.round(((numMrp - numPrice) / numMrp) * 100);

      product.name = name.trim();
      product.description = description ? description.trim() : "";
      product.mrp = numMrp;
      product.price = numPrice;
      product.discountPercentage = calculatedDiscount > 0 ? calculatedDiscount : 0;
      product.stock = Number(stock);
      product.category = category;
      product.isActive = isActive === "on" || isActive === "true" || isActive === true;
      product.images = newImages;

      await product.save();

      req.flash("success", "Product updated successfully!");
      return res.redirect("/shop/all/products");
    } catch (error) {
      console.error("Update Product Error:", error);
      // Rollback new uploads
      for (const img of uploadedImages) {
        await cloudinary.uploader.destroy(img.public_id).catch(() => {});
      }
      req.flash("error", "Failed to update product.");
      return res.redirect("/shop/all/products");
    }
  }


  async deleteProduct(req, res) {
    try {
      const userId = req.user.id;
      const { productId } = req.params;

      const shop = await Shop.findOne({ owner: userId });
      if (!shop) {
        req.flash("error", "Shop not found.");
        return res.redirect("/shop/dashboard");
      }

      const product = await Product.findOneAndDelete({ _id: productId, shop: shop._id });
      if (!product) {
        req.flash("error", "Product not found.");
        return res.redirect("/shop/all/products");
      }

      // Delete images from Cloudinary (best-effort)
      for (const url of product.images) {
        const parts = url.split("/");
        const publicId = parts.slice(-2).join("/").replace(/\.[^/.]+$/, "");
        await cloudinary.uploader.destroy(publicId).catch(() => {});
      }

      req.flash("success", `"${product.name}" deleted successfully.`);
      return res.redirect("/shop/all/products");
    } catch (error) {
      console.error("Delete Product Error:", error);
      req.flash("error", "Failed to delete product.");
      return res.redirect("/shop/all/products");
    }
  }


  // Order Management
  // List all orders for this shop (paginated)
  async getOrders(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;
      const statusFilter = req.query.status || "";

      const shop = await Shop.findOne({ owner: userId });
      if (!shop) {
        req.flash("error", "Shop profile not found.");
        return res.redirect("/shop/dashboard");
      }

      const query = { shop: shop._id };
      if (statusFilter) query.orderStatus = statusFilter;

      const totalOrders = await Order.countDocuments(query);
      const orders = await Order.find(query)
        .populate("user", "name email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.render("shop/orders", {
        user: req.user,
        shop,
        hasProfile: true,
        orders,
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        statusFilter,
        limit,
      });
    } catch (error) {
      console.error("Get Orders Error:", error);
      req.flash("error", "Failed to load orders.");
      return res.redirect("/shop/dashboard");
    }
  }

  // View a single order detail
  async getOrderDetail(req, res) {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;

      const shop = await Shop.findOne({ owner: userId });
      if (!shop) {
        req.flash("error", "Shop profile not found.");
        return res.redirect("/shop/dashboard");
      }

      const order = await Order.findOne({ _id: orderId, shop: shop._id })
        .populate("user", "name email profileImage")
        .populate("items.product", "name images price");

      if (!order) {
        req.flash("error", "Order not found.");
        return res.redirect("/shop/orders");
      }

      res.render("shop/order-detail", {
        user: req.user,
        shop,
        hasProfile: true,
        order,
        statusOptions: [
          "Pending",
          "Confirmed",
          "Processing",
          "Shipped",
          "Delivered",
          "Cancelled",
        ],
      });
    } catch (error) {
      console.error("Get Order Detail Error:", error);
      req.flash("error", "Failed to load order.");
      return res.redirect("/shop/orders");
    }
  }

  // Update an order's status
  async updateOrderStatus(req, res) {
    try {
      const userId = req.user.id;
      const { orderId } = req.params;
      const { orderStatus: newStatus } = req.body;

      // Define the linear progression chain
      const progressChain = [
        "Pending",
        "Confirmed",
        "Processing",
        "Shipped",
        "Delivered",
      ];

      const allValid = [...progressChain, "Cancelled"];

      if (!allValid.includes(newStatus)) {
        req.flash("error", "Invalid order status.");
        return res.redirect(`/shop/orders/${orderId}`);
      }

      const shop = await Shop.findOne({ owner: userId });
      if (!shop) {
        req.flash("error", "Shop not found.");
        return res.redirect("/shop/dashboard");
      }

      // Fetch current order BEFORE updating
      const existingOrder = await Order.findOne({ _id: orderId, shop: shop._id });
      if (!existingOrder) {
        req.flash("error", "Order not found.");
        return res.redirect("/shop/orders");
      }

      const currentStatus = existingOrder.orderStatus;

      // ── Block backward / lateral changes 
     
      if (currentStatus === "Delivered" || currentStatus === "Cancelled") {
        req.flash(
          "error",
          `Order is already "${currentStatus}". No further status changes are allowed.`
        );
        return res.redirect(`/shop/orders/${orderId}`);
      }

      // For progress-chain statuses, new status must be STRICTLY ahead
      const currentIdx = progressChain.indexOf(currentStatus);
      const newIdx = progressChain.indexOf(newStatus);

      if (newStatus !== "Cancelled" && newIdx <= currentIdx) {
        req.flash(
          "error",
          `Cannot revert order from "${currentStatus}" back to "${newStatus}". Orders can only move forward.`
        );
        return res.redirect(`/shop/orders/${orderId}`);
      }
      // ────────────────────────────────────────────────────────────────────────

      existingOrder.orderStatus = newStatus;
      await existingOrder.save();

      // ── Send delivery confirmation email ──────────────────────────────────
      if (newStatus === "Delivered") {
        try {
          const orderUser = await User.findById(existingOrder.user);
          if (orderUser) {
            await sendOrderDeliveredEmail(orderUser, existingOrder, shop.shopName);
          }
        } catch (mailErr) {
          console.error("Delivery email failed (non-blocking):", mailErr.message);
        }
      }

      req.flash("success", `Order status updated to "${newStatus}"`);
      return res.redirect(`/shop/orders/${orderId}`);
    } catch (error) {
      console.error("Update Order Status Error:", error);
      req.flash("error", "Failed to update order status.");
      return res.redirect("/shop/orders");
    }
  }

  // ─── Earnings ──
  async getEarnings(req, res) {
    try {
      const userId = req.user.id;
      const page = parseInt(req.query.page) || 1;
      const limit = 10;
      const skip = (page - 1) * limit;

      const shop = await Shop.findOne({ owner: userId });
      if (!shop) {
        req.flash("error", "Shop profile not found.");
        return res.redirect("/shop/dashboard");
      }

      const shopId = shop._id;
      const now = new Date();

      // ── Time windows ────────────────────────────────────────────────────────
      const startOfToday = new Date(now); startOfToday.setHours(0, 0, 0, 0);
      const startOfWeek  = new Date(now); startOfWeek.setDate(now.getDate() - now.getDay()); startOfWeek.setHours(0, 0, 0, 0);
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear  = new Date(now.getFullYear(), 0, 1);
      // Previous month window (for growth %)
      const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const endOfPrevMonth   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

      // ── Helper: sum revenue from delivered orders in a date range ────────────
      const sumRevenue = async (from, to) => {
        const agg = await Order.aggregate([
          {
            $match: {
              shop: shopId,
              orderStatus: "Delivered",
              createdAt: { $gte: from, ...(to ? { $lte: to } : {}) },
            },
          },
          { $group: { _id: null, total: { $sum: "$totalAmount" }, count: { $sum: 1 } } },
        ]);
        return agg.length > 0 ? { total: agg[0].total, count: agg[0].count } : { total: 0, count: 0 };
      };

      const [allTime, thisMonth, prevMonth, thisWeek, today] = await Promise.all([
        sumRevenue(new Date(0)),
        sumRevenue(startOfMonth),
        sumRevenue(startOfPrevMonth, endOfPrevMonth),
        sumRevenue(startOfWeek),
        sumRevenue(startOfToday),
      ]);

      // Month-over-month growth
      const monthGrowth = prevMonth.total > 0
        ? (((thisMonth.total - prevMonth.total) / prevMonth.total) * 100).toFixed(1)
        : thisMonth.total > 0 ? 100 : 0;

      // Average order value (delivered)
      const avgOrderValue = allTime.count > 0
        ? (allTime.total / allTime.count).toFixed(2)
        : "0.00";

      // Total delivered orders & total cancelled
      const [deliveredCount, cancelledCount, pendingCount] = await Promise.all([
        Order.countDocuments({ shop: shopId, orderStatus: "Delivered" }),
        Order.countDocuments({ shop: shopId, orderStatus: "Cancelled" }),
        Order.countDocuments({ shop: shopId, orderStatus: { $in: ["Pending", "Confirmed", "Processing", "Shipped"] } }),
      ]);

      // ── Last 6 months bar chart ──────────────────────────────────────────────
      const monthNames = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      const barLabels = [];
      const barData   = [];

      for (let i = 5; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const from = new Date(d.getFullYear(), d.getMonth(), 1);
        const to   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59);
        barLabels.push(monthNames[d.getMonth()]);
        const r = await sumRevenue(from, to);
        barData.push(r.total);
      }

      // ── Top 5 selling products (by revenue from delivered orders) ────────────
      const topProducts = await Order.aggregate([
        { $match: { shop: shopId, orderStatus: "Delivered" } },
        { $unwind: "$items" },
        {
          $group: {
            _id: "$items.product",
            productName: { $first: "$items.productName" },
            totalRevenue: { $sum: "$items.subtotal" },
            totalQty: { $sum: "$items.quantity" },
            orderCount: { $sum: 1 },
          },
        },
        { $sort: { totalRevenue: -1 } },
        { $limit: 5 },
      ]);

      // ── Recent transactions (paginated delivered orders) ─────────────────────
      const totalTxns = await Order.countDocuments({ shop: shopId, orderStatus: "Delivered" });
      const transactions = await Order.find({ shop: shopId, orderStatus: "Delivered" })
        .populate("user", "name email profileImage")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit);

      res.render("shop/earnings", {
        user: req.user,
        shop,
        hasProfile: true,
        // Summary cards
        totalEarnings: allTime.total.toFixed(2),
        thisMonthEarnings: thisMonth.total.toFixed(2),
        thisWeekEarnings: thisWeek.total.toFixed(2),
        todayEarnings: today.total.toFixed(2),
        monthGrowth: parseFloat(monthGrowth),
        avgOrderValue,
        deliveredCount,
        cancelledCount,
        pendingCount,
        // Charts
        barLabels,
        barData,
        // Tables
        topProducts,
        transactions,
        currentPage: page,
        totalPages: Math.ceil(totalTxns / limit),
        totalTxns,
        limit,
      });
    } catch (error) {
      console.error("Earnings Error:", error);
      req.flash("error", "Failed to load earnings.");
      return res.redirect("/shop/dashboard");
    }
  }
}

module.exports = new ShopController();
