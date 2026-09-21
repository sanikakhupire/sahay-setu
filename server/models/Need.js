const mongoose = require('mongoose');

const needSchema = new mongoose.Schema(
  {
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: [true, 'Need type is required'],
      enum: [
        'boat',
        'generator',
        'water_pump',
        'first_aid_kit',
        'dry_ration',
        'drinking_water',
        'blanket',
        'torch',
        'medicine',
        'vehicle',
        'other',
      ],
    },
    description: {
      type: String,
      required: [true, 'A description is required'],
      trim: true,
      maxlength: 200,
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
      default: 1,
    },
    urgency: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
    },
    ward: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        required: true,
        validate: {
          validator: function (coords) {
            return (
              coords.length === 2 &&
              coords[0] >= -180 && coords[0] <= 180 &&
              coords[1] >= -90 && coords[1] <= 90
            );
          },
          message: 'Invalid coordinates — expected [longitude, latitude]',
        },
      },
    },
    address: {
      type: String,
      trim: true,
    },
    contactPhone: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['open', 'matched', 'dispatched', 'fulfilled', 'cancelled'],
      default: 'open',
    },
    matchedResource: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      default: null,
    },
  },
  { timestamps: true }
);

needSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Need', needSchema);