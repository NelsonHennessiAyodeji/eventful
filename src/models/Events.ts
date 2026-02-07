import mongoose, { Schema, Document, Types } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description: string;
  category:
    | "concert"
    | "theater"
    | "sports"
    | "cultural"
    | "workshop"
    | "conference"
    | "other";
  startDate: Date;
  endDate: Date;
  venue: {
    name: string;
    address: string;
    city: string;
    country: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  organizer: Types.ObjectId;
  tickets: {
    total: number;
    sold: number;
    price: number;
    currency: string;
    types: Array<{
      name: string;
      price: number;
      quantity: number;
      sold: number;
    }>;
  };
  images: string[];
  socialLinks: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
    website?: string;
  };
  reminderSettings: {
    creatorReminder: {
      enabled: boolean;
      intervals: number[]; // hours before event
    };
  };
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      enum: [
        "concert",
        "theater",
        "sports",
        "cultural",
        "workshop",
        "conference",
        "other",
      ],
      required: true,
    },
    startDate: {
      type: Date,
      required: true,
    },
    endDate: {
      type: Date,
      required: true,
    },
    venue: {
      name: {
        type: String,
        required: true,
      },
      address: {
        type: String,
        required: true,
      },
      city: {
        type: String,
        required: true,
      },
      country: {
        type: String,
        required: true,
      },
      coordinates: {
        lat: Number,
        lng: Number,
      },
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tickets: {
      total: {
        type: Number,
        required: true,
        min: 1,
      },
      sold: {
        type: Number,
        default: 0,
      },
      price: {
        type: Number,
        required: true,
        min: 0,
      },
      currency: {
        type: String,
        default: "NGN",
      },
      types: [
        {
          name: {
            type: String,
            required: true,
          },
          price: {
            type: Number,
            required: true,
            min: 0,
          },
          quantity: {
            type: Number,
            required: true,
            min: 0,
          },
          sold: {
            type: Number,
            default: 0,
          },
        },
      ],
    },
    images: [
      {
        type: String,
      },
    ],
    socialLinks: {
      facebook: String,
      twitter: String,
      instagram: String,
      website: String,
    },
    reminderSettings: {
      creatorReminder: {
        enabled: {
          type: Boolean,
          default: true,
        },
        intervals: {
          type: [Number],
          default: [24, 2], // 24 hours and 2 hours before
        },
      },
    },
    isPublished: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better query performance
eventSchema.index({ organizer: 1, createdAt: -1 });
eventSchema.index({ category: 1, startDate: 1 });
eventSchema.index({ "venue.city": 1, startDate: 1 });
eventSchema.index({ isPublished: 1, startDate: 1 });

const Event = mongoose.model<IEvent>("Event", eventSchema);
export default Event;
