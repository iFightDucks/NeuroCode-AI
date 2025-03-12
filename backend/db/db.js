import mongoose from "mongoose";

function connect(){
    mongoose.connect(process.env.MONGODB_URI)
    .then(()=>{
        console.log("Connected to MongoDB")
    })
    .catch((error)=>{
        console.log("Error connecting to MongoDB: ", error)
    })
}

export default connect;