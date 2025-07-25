import validator from "validator"
import bcrypt from 'bcrypt'
import { v2 as cloudinary } from "cloudinary"
import doctorModel from "../models/doctorModel.js"
import jwt from 'jsonwebtoken'
import appointmentModel from "../models/appointmentModel.js"
import UserModel from "../models/userModel.js"

// api for adding doctor
const addDoctor = async (req,res) => {
    try {
        const {name,email,password,speciality,degree,experience,about,fees,address} = req.body
        const imageFile = req.file

        // checking for all data to add doctor
        if(!name || !email || !password || !speciality || !degree || !experience || !about || !fees || !address){
            return res.json({success:false,message:"Missing Details"})
        }

        //validating email format
        if(!validator.isEmail(email)){
            return res.json({success:false,message:"Please enter a valid email"})
        }

        //validating strong password
        if(password.length < 8){
            return res.json({success:false,message:"please enter a strong password"})
        }

        // hashing doctor password
        const salt = await bcrypt.genSalt(10)
        const hashedPassword = await bcrypt.hash(password, salt)

        // upload image to cloudinary
        const imageupload =await cloudinary.uploader.upload(imageFile.path,{resource_type:"image"})
        const imageUrl=imageupload.secure_url

        const doctorData={
            name,
            email,
            image:imageUrl,
            password:hashedPassword,
            speciality,
            degree,
            experience,
            about,
            fees,
            address:JSON.parse(address),
            date:Date.now()
        }

        const newDoctor = new doctorModel(doctorData)
        await newDoctor.save()

        res.json({success:true,message:"Doctor Added"})

    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

// api for admin login
const loginAdmin = async (req, res) => {
    try {
        const {email, password} = req.body

        if(email === process.env.EMAIL_USER && password === process.env.EMAIL_PASSWORD){
            const token = jwt.sign(email+password, process.env.JWT_SECRET)
            res.json({success:true,token})
        } else {
            res.json({success:false,message:"Invalid Credentials"})
        }
    } catch (error) {
        console.log(error);
        res.json({success:false,message:error.message})
    }
}

//api to get all doctors list for admin panel
const allDoctors = async (req,res) =>{
    try {
        const doctors = await doctorModel.find({}).select('-password')
        res.json({success:true,doctors})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }
}

// api to get all appointments for admin panel
const appointmentsAdmin = async (req,res) => {
    try {
        const appointments = await appointmentModel.find({})
        res.json({success:true, appointments})
    } catch (error) {
        console.log(error)
        res.json({success:false, message:error.message})
    }
}


//API to cancel the appointment cancellation
const appointmentCancel =async(req,res)=>{
    try {
        const {appointmentId}=req.body
        const appointmentData = await appointmentModel.findById(appointmentId)
        
           await appointmentModel.findByIdAndUpdate(appointmentData,{cancelled:true})

           //releasing doctor slots 
           const {docId,slotDate,slotTime}=appointmentData
           const doctorData = await doctorModel.findById(docId)

           let slots_booked=doctorData.slots_booked
           slots_booked[slotDate]=slots_booked[slotDate].filter(e=>e !==slotTime)
           await doctorModel.findByIdAndUpdate(docId,{slots_booked})

           res.json({success:true,message:"Appointment Cancel"})
    } catch (error) {
        console.log(error)
        res.json({success:false,message:error.message})
    }

}


//API to get dashboard data for admin panel
const adminDashboard =async (req,res)=>{
    try {
        const doctors =await doctorModel.find({})
        const users=await UserModel.find({})
        const appointments=await appointmentModel.find({}) 
    
        const dashData={
            doctors:doctors.length,
            appointments:appointments.length,
            patients:users.length,
            latestAppointments:appointments.reverse().slice(0,6)
        }
        res.json({success:true,dashData})
    } catch (error) {
        console.log(error)
            res.json({success:false,message:error.message})
    }
    }
const verifyQRCode = async (req, res) => {
    try {
        const { qrCode } = req.body; // QR Code contains the appointment ID

        // Find the appointment by QR code (assuming QR stores appointment ID)
        const appointment = await appointmentModel.findOne({ _id: qrCode });

        if (!appointment) {
            return res.status(404).json({ success: false, message: "Invalid QR Code" });
        }

        // If the appointment is already completed
        if (appointment.isCompleted) {
            return res.json({ success: false, message: "Appointment is already marked as completed!" });
        }

        // Mark appointment as completed
        appointment.isCompleted = true;
        await appointment.save();

        res.json({ success: true, message: "Appointment marked as completed" });
    } catch (error) {
        console.log(error);
        res.json({ success: false, message: "Error verifying QR Code" });
    }
};

export {addDoctor,loginAdmin,allDoctors,appointmentsAdmin,appointmentCancel, adminDashboard}