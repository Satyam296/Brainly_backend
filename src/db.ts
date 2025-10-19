import mongoose, { model, Schema } from "mongoose";

// MongoDB connection
const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
    console.error("MONGO_URI is not set. Please provide a valid connection string in your environment variables.");
    process.exit(1);
}

mongoose.connect(MONGO_URI)
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.log("DB Connection Error:", err));
    
const UserSchema = new Schema({
    username : {type : String , unique :true},
    password : String 
})

export const UserModel = model("User", UserSchema) ; 

const ContentSchema = new Schema({
    title : {type: String},
    link : {type :String},
    tags : [{type : mongoose.Types.ObjectId, ref:"Tag"}],
    type : String , 
    userId : {type : mongoose.Types.ObjectId , ref :"User" , required : true}
})

export const ContentModel = model("Content" , ContentSchema) ;

const LinkSchema = new Schema({
    hash : String ,
    userId : {type : mongoose.Types.ObjectId , ref :"User" , required : true , unique : true},

})

export const LinkModel = model("Links" , LinkSchema) ;
