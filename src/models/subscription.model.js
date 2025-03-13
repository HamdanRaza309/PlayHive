import mongoose from 'mongoose'

const subscriptionSchema = new mongoose.Schema(
    {
        subscriber: {  // Reference to the user who is subscribing (the subscriber)
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        channel: { // Reference to the user or channel being subscribed to
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    },
    {
        timestamps: true
    }
)

export const Subscription = mongoose.model('Subscription', subscriptionSchema)