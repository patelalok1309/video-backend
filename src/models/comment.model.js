import mongooseAggregatePaginate from 'mongoose-aggregate-paginate-v2';
import mongoose, { Schema } from 'mongoose'
import mongoosePaginate from 'mongoose-paginate-v2'


const commentSchema = new Schema({
    content: {
        type: String,
        required: true
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
commentSchema.plugin(mongoosePaginate)

export const Comment = mongoose.model('Comment', commentSchema);
