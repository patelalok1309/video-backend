import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { Schema } from 'mongoose'

const commentSchema = new Schema({
    content: {
        type: String,
        required: truem
    },
    video: {
        type: mongoose.Types.ObjectId,
        ref: 'Video'
    },
    owner: {
        type: mongoose.Types.ObjectId,
        ref: 'User'
    }
}, { timestamps: true });

commentSchema.plugin(mongooseAggregatePaginate)

export const Comment = mongoose.model('Comment' , commentSchema);
