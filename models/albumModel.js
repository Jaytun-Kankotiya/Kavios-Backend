import mongoose from "mongoose";

const AlbumSchema = new mongoose.Schema({
    albumId: {
        type: String,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    description: {
        type: String,
    },
    ownerId: {
        type: String,
        required: true,
        ref: "User"
    },
    sharedUsers: [{
        type: String
    }]
}, {
    timestamps: true
})

const Album = mongoose.model('Album', AlbumSchema)
export default Album
