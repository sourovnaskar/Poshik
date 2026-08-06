const Kyc = require("../models/kycModel");
const Doctor = require("../models/doctorModel");
const DoctorSchedule = require("../models/doctorScheduleModel");
const cloudinary = require("../config/cloudinary");
const fs = require("fs/promises");
const User = require("../models/userModel");
const doctorScheduleModel = require("../models/doctorScheduleModel");
const Appointment = require("../models/appointmentModel");
const { date } = require("joi");

class DoctorController {
  async renderDashboard(req, res) {
    try {
      const loggedUser = req.user;
      const userId = loggedUser.id;

      const doctorProfile = await Doctor.findOne({ user: userId });
      const hasProfile = doctorProfile ? true : false;

      let todaysAppointmentsCount = 0;
      let pendingAppointmentsCount = 0;
      let weeklyEarnings = 0;
      let recentAppointments = [];

      if (hasProfile) {
        const Appointment = require("../models/appointmentModel");

        // Today's Date boundaries
        const startOfToday = new Date();
        startOfToday.setHours(0, 0, 0, 0);
        const endOfToday = new Date();
        endOfToday.setHours(23, 59, 59, 999);

        // Calculate Today's Appointments
        todaysAppointmentsCount = await Appointment.countDocuments({
          doctor: doctorProfile._id,
          appointmentDate: { $gte: startOfToday, $lte: endOfToday },
        });

        // Calculate Pending Appointments
        pendingAppointmentsCount = await Appointment.countDocuments({
          doctor: doctorProfile._id,
          status: "Pending",
        });

        // Calculate Weekly Earnings (from Completed appointments in the last 7 days)
        const startOfWeek = new Date();
        startOfWeek.setDate(startOfWeek.getDate() - 7);

        const weeklyAppointments = await Appointment.find({
          doctor: doctorProfile._id,
          status: "Completed",
          updatedAt: { $gte: startOfWeek },
        });

        weeklyEarnings = weeklyAppointments.reduce(
          (sum, appt) => sum + (appt.consultationFee || 0),
          0,
        );

        // Fetch Recent/Upcoming Appointments for the dashboard table
        recentAppointments = await Appointment.find({
          doctor: doctorProfile._id,
        })
          .populate("owner", "name")
          .populate("pet", "name species")
          .populate("schedule", "date startTime endTime")
          .sort({ appointmentDate: 1 })
          .limit(5); // Show only the next 5
      }

      res.render("doctors/dashboard", {
        user: loggedUser,
        hasProfile: hasProfile,
        todaysAppointmentsCount,
        pendingAppointmentsCount,
        weeklyEarnings,
        recentAppointments,
      });
    } catch (error) {
      console.error(error);
      req.flash("error", "Error loading dashboard data");
      res.render("doctors/dashboard", {
        user: req.user,
        hasProfile: false,
        todaysAppointmentsCount: 0,
        pendingAppointmentsCount: 0,
        weeklyEarnings: 0,
        recentAppointments: [],
      });
    }
  }

  async renderKycForm(req, res) {
    const loggedUser = req.user;
    res.render("doctors/kyc-submit", { user: loggedUser });
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
        return res.redirect("/api/doctor/dashboard");
      }

      const { idType, addressProofType } = req.body;

      const files = req.files;

      if (!files || !files.idProof || !files.addressProof) {
        req.flash("error", "ID Proof and Address Proof are mandatory!");
        return res.redirect("/api/doctor/kyc-form");
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
          folder: "Poshik/KYC-Documents",
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
      return res.redirect("/api/doctor/dashboard");
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
      return res.redirect("/api/doctor/kyc/form");
    }
  }

  async createProfileForm(req, res) {
    try {
      const loggedUser = req.user;
      return res.render("doctors/profile-setup", {
        user: loggedUser,
      });
    } catch (error) {
      console.error(error.message);
      return req.flash("error", "Something error Ocuured");
    }
  }

  async submitProfile(req, res) {
    try {
      const loggedUser = req.user;
      const userId = loggedUser.id;

      const {
        specialization,
        qualification,
        experience,
        consultationFee,
        bio,
        clinicAddress,
      } = req.body;

      if (
        !specialization ||
        !qualification ||
        !experience ||
        !consultationFee ||
        !bio ||
        !clinicAddress
      ) {
        req.flash("error", "All fields are required");
        return res.redirect("/api/doctor/profile/form");
      }
      const existingProfile = await Doctor.findOne({ user: userId });
      if (existingProfile) {
        req.flash("error", "You already have an active profile.");
        return res.redirect("/api/doctor/dashboard");
      }
      const creation = new Doctor({
        user: userId,
        specialization,
        qualification,
        experience,
        consultationFee,
        bio,
        clinicAddress,
      });

      await creation.save();
      req.flash(
        "success",
        "Your Profile has been created Successfully and is now active!",
      );
      return res.redirect("/api/doctor/dashboard");
    } catch (error) {
      console.error(error.message);
      req.flash(
        "error",
        "An error occurred while saving your profile. Please try again.",
      );
      return res.redirect("/api/doctor/profile/form");
    }
  }

  async renderSchedule(req, res) {
    try {
      const loggedUser = req.user;
      const userId = loggedUser.id;

      const doctorProfile = await Doctor.findOne({ user: userId });

      if (!doctorProfile) {
        req.flash(
          "error",
          "Doctor profile not found. Please create your profile first.",
        );
        return res.redirect("/api/doctor/profile/form");
      }

      const schedules = await DoctorSchedule.find({
        doctor: doctorProfile._id,
      }).sort({ date: 1, startTime: 1 });

      res.render("doctors/schedule", {
        user: loggedUser,
        schedules: schedules,
      });
    } catch (error) {
      console.error("Error fetching schedule page:", error.message);
      req.flash("error", "Could not load your schedule at this time.");
      return res.redirect("/api/doctor/dashboard");
    }
  }

  async createSchedule(req, res) {
    try {
      const loggedUser = req.user;
      const userId = loggedUser.id;

      const doctorProfile = await Doctor.findOne({ user: userId });

      if (!doctorProfile) {
        req.flash(
          "error",
          "Doctor profile not found. Please create your profile first.",
        );
        return res.redirect("/api/doctor/profile/form");
      }

      const { date, startTime, endTime, maxPatients } = req.body;

      if (!date || !startTime || !endTime || !maxPatients) {
        req.flash("error", "All fields are required");
        return res.redirect("/api/doctor/appointment/schedule");
      }
      const existingSchedule = await DoctorSchedule.findOne({
        doctor: doctorProfile._id,
        date,
        startTime,
      });
      if (existingSchedule) {
        req.flash(
          "error",
          "You already have an active Schedule in that Time .",
        );
        return res.redirect("/api/doctor/appointment/schedule");
      }
      const schedule = new DoctorSchedule({
        doctor: doctorProfile._id,
        date,
        startTime,
        endTime,
        maxPatients,
      });

      await schedule.save();
      req.flash("success", "Schedule Created");
      return res.redirect("/api/doctor/dashboard");
    } catch (error) {
      console.error(error.message);
      req.flash(
        "error",
        "An error occurred while saving your Schedule. Please try again.",
      );
      return res.redirect("/api/doctor/appointment/schedule");
    }
  }

  async renderUpdateSchedule(req, res) {
    try {
      const scheduleId = req.params.id;
      const loggedUser = req.user;
      const userId = loggedUser.id;

      const doctorProfile = await Doctor.findOne({ user: userId });

      if (!doctorProfile) {
        req.flash("error", "Doctor profile not found.");
        return res.redirect("/api/doctor/profile/form");
      }

      const schedule = await DoctorSchedule.findById(scheduleId);

      if (!schedule) {
        req.flash("error", "Shift not found.");
        return res.redirect("/api/doctor/appointment/schedule");
      }

      if (schedule.doctor.toString() !== doctorProfile._id.toString()) {
        req.flash(
          "error",
          "Unauthorized access. You can only edit your own shifts.",
        );
        return res.redirect("/api/doctor/appointment/schedule");
      }

      res.render("doctors/edit-schedule", {
        user: req.user,
        schedule: schedule,
      });
    } catch (error) {
      console.error("Error loading edit page:", error.message);
      req.flash("error", "Could not load the edit page at this time.");
      return res.redirect("/api/doctor/appointment/schedule");
    }
  }

  async updateSchedule(req, res) {
    try {
      const appointmentId = req.params.id;
      const userId = req.user.id;

      const { date, startTime, endTime, maxPatients } = req.body;

      const updatedSchedule = {};

      if (date) updatedSchedule.date = date;
      if (startTime) updatedSchedule.startTime = startTime;
      if (endTime) updatedSchedule.endTime = endTime;
      if (maxPatients) updatedSchedule.maxPatients = maxPatients;

      const update = await DoctorSchedule.findByIdAndUpdate(
        { _id: appointmentId },
        updatedSchedule,
        { new: true },
      );
      req.flash("success", " Your Schedule Updated Successfully!! ");
      return res.redirect("/api/doctor/appointment/schedule");
    } catch (error) {
      console.error(error.message);
      req.flash(
        "error",
        "An error occurred while Update your Schedule!! Please try again.",
      );
      return res.redirect("/api/doctor/appointment/schedule");
    }
  }

  async cancelSchedule(req, res) {
    try {
      const appointmentId = req.params.id;
      const userId = req.user.id;

      const cancel = await doctorScheduleModel.findByIdAndDelete({
        _id: appointmentId,
      });
      req.flash("success", "Your Schedule Successfully canceled.");
      return res.redirect("/api/doctor/appointment/schedule");
    } catch (error) {
      console.error(error.message);
      req.flash(
        "error",
        "An error occurred while Cancel your Schedule. Please try again.",
      );
      return res.redirect("/api/doctor/appointment/schedule");
    }
  }

  // Fetch and display doctor's appointments
  async renderAppointments(req, res) {
    try {
      const loggedUser = req.user;
      const userId = loggedUser.id;

      const doctorProfile = await Doctor.findOne({ user: userId });

      if (!doctorProfile) {
        req.flash("error", "Doctor profile not found.");
        return res.redirect("/api/doctor/profile/form");
      }

      // Fetch appointments and populate related data
      const appointments = await Appointment.find({ doctor: doctorProfile._id })
        .populate("owner", "name email")
        .populate("pet", "name species breed age")
        .populate("schedule", "date startTime endTime");

      res.render("doctors/appointments", {
        user: loggedUser,
        appointments: appointments,
      });
    } catch (error) {
      console.error("Error fetching appointments:", error.message);
      req.flash("error", "Could not load appointments.");
      return res.redirect("/api/doctor/dashboard");
    }
  }

  // Update the status of an appointment
  async updateAppointmentStatus(req, res) {
    try {
      const { id } = req.params;
      const { status } = req.body;
      const loggedUser = req.user;
      const userId = loggedUser.id;

      const doctorProfile = await Doctor.findOne({ user: userId });
      if (!doctorProfile) {
        req.flash("error", "Unauthorized access.");
        return res.redirect("/api/doctor/dashboard");
      }

      const appointment = await Appointment.findOne({
        _id: id,
        doctor: doctorProfile._id,
      });
      if (!appointment) {
        req.flash("error", "Appointment not found.");
        return res.redirect("/api/doctor/appointments");
      }

      // Update and save status
      appointment.status = status;
      await appointment.save();

      req.flash(
        "success",
        `Appointment status successfully updated to ${status}.`,
      );
      return res.redirect("/api/doctor/appointments");
    } catch (error) {
      console.error("Error updating appointment status:", error.message);
      req.flash("error", "Could not update appointment status.");
      return res.redirect("/api/doctor/appointments");
    }
  }

  // Fetch and calculate earnings for the doctor
  async renderEarnings(req, res) {
    try {
      const loggedUser = req.user;
      const userId = loggedUser.id;

      const doctorProfile = await Doctor.findOne({ user: userId });

      if (!doctorProfile) {
        req.flash("error", "Doctor profile not found.");
        return res.redirect("/api/doctor/profile/form");
      }

      // Fetch all Completed Appointments for this doctor
      const completedAppointments = await Appointment.find({
        doctor: doctorProfile._id,
        status: "Completed",
      })
        .populate("owner", "name")
        .populate("pet", "name image")
        .sort({ updatedAt: -1 });

      // Initialize counters
      let totalEarnings = 0;
      let monthlyEarnings = 0;
      let weeklyEarnings = 0;

      const now = new Date();

      // First day of current month
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // First day of current week
      const startOfWeek = new Date(now);
      const day = startOfWeek.getDay();
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
      startOfWeek.setDate(diff);
      startOfWeek.setHours(0, 0, 0, 0);

      completedAppointments.forEach((appt) => {
        const fee = appt.consultationFee || 0;
        totalEarnings += fee;

        const updatedDate = new Date(appt.updatedAt || appt.appointmentDate);

        if (updatedDate >= startOfMonth) {
          monthlyEarnings += fee;
        }

        if (updatedDate >= startOfWeek) {
          weeklyEarnings += fee;
        }
      });

      res.render("doctors/earnings", {
        user: loggedUser,
        totalEarnings,
        monthlyEarnings,
        weeklyEarnings,
        transactions: completedAppointments,
      });
    } catch (error) {
      console.error("Error loading earnings:", error);
      req.flash("error", "Error loading earnings data.");
      return res.redirect("/api/doctor/dashboard");
    }
  }

  async mypatients(req, res) {
    try {
      const loggedUser = req.user;
      const userId = loggedUser.id;

      const doctorProfile = await Doctor.findOne({ user: userId });

      if (!doctorProfile) {
        req.flash("error", "Doctor profile not found.");
        return res.redirect("/api/doctor/profile/form");
      }
      const patients = await Appointment.find({
        doctor: doctorProfile._id,
      })
        .populate("owner", " name")
        .populate("pet", "-owner -vaccinationDetails -medicalHistory");
      res.render("doctors/my-patients", {
        user: loggedUser,
        patients: patients,
      });
    } catch (error) {
      console.error("Error loading My-patients:", error);
      req.flash("error", "Error loading earnings data.");
      return res.redirect("/api/doctor/dashboard");
    }
  }
}
module.exports = new DoctorController();
