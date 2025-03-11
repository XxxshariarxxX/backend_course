import mongoose, {Schema} from "mongoose";

const SubscriptionSchema = new Schema({
  subsciber: {
    type: Schema.Types.ObjectId,//this is the user who is subscribing
    ref: "User"
  },
  channel: {
    type: Schema.Types.ObjectId,//this is the user who is being subscribed to
    ref: "User"
  },
  

}, {timestamps: true});


export const Subscription = mongoose.model("Subscription", SubscriptionSchema);