import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const UserSchema = new mongoose.Schema({
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true
    },
    password:{
        type:String,
        select:false
    }
})

UserSchema.statics.hashPassword =async function(password){
    return await bcrypt.hash(password, 10)
}

UserSchema.methods.isValidPassword = async function (password) {
    return await bcrypt.compare(password, this.password);
}

UserSchema.methods.generateJWT = async function(){
    return jwt.sign({email:this.email}, process.env.HASH_KEY);
}

const User = mongoose.model('User', UserSchema);

export default User;