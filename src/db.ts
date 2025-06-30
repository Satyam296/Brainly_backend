import mongoose , {model , Schema} from "mongoose" ; 
mongoose.connect("mongodb+srv://SatyamDB:xxUo2yUsh1mJC36N@cluster0.sdy3k.mongodb.net/Brainly");
mongoose.connect(process.env.MONGO_URI || "mongodb+srv://SatyamDB:xxUo2yUsh1mJC36N@cluster0.sdy3k.mongodb.net/Brainly")
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
