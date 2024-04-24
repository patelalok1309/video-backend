import mongoose, { Schema } from 'mongoose'
import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import { unlinkFromCloudinary } from '../utils/cloudinary.js';


const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //cloudinary url
            required: true,
        },
        thumbnail: {
            type: String, //cloudinary url
            required: true,
        },
        title: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: false,
        },
        duration: {
            type: Number,
            required: true,
        },
        views: {
            type: Number,
            default: 0
        },
        isPublished: {
            type: Boolean,
            default: true
        },
        owner: {
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    }
    , {
        timestamps: true
    }
)

videoSchema.plugin(mongooseAggregatePaginate)

videoSchema.pre('remove', async function (next) {
    if (this.thumbnail) {
        const res = await unlinkFromCloudinary(this.thumbnail);
    }
    if (this.videoFile) {
        const res = await unlinkFromCloudinary(this.videoFile);
    }

    next();
})

export const Video = mongoose.model('Video', videoSchema);