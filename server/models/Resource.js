const mongoose = require('mongoose');

const resourceSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: [true, 'Resource type is required'],
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
    label: {
      type: String,
      required: [true, 'A short description is required'],
      trim: true,
      maxlength: 100,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      default: 1,
    },
    ward: {
      type: String,
      required: true,
      trim: true,
    },
    // GeoJSON Point — required structure for MongoDB 2dsphere indexing
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [longitude, latitude] — GeoJSON order, NOT lat/lng
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
    status: {
      type: String,
      enum: ['available', 'reserved', 'in_use', 'unavailable'],
      default: 'available',
    },
    contactPhone: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

// Critical: 2dsphere index enables geospatial queries like $near, $geoWithin
resourceSchema.index({ location: '2dsphere' });

module.exports = mongoose.model('Resource', resourceSchema);