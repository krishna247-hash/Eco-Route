import mongoose from 'mongoose';

/**
 * A saved itinerary. The full optimizer result is kept in `result` so the
 * client can re-render every plan; the flattened fields support listing
 * and querying without loading the whole document.
 */
const tripSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    travelerName: { type: String, trim: true, maxlength: 80 },
    originName: { type: String, required: true },
    destinationName: { type: String, required: true },
    startDate: String,
    endDate: String,
    travelers: Number,
    selectedPlan: {
      type: String,
      enum: ['ecoChampion', 'balanced', 'fastest'],
      default: 'balanced',
    },
    totalCarbonKg: Number,
    totalCost: Number,
    savedCarbonKg: Number,
    ecoScore: String,
    passCode: { type: String, unique: true, index: true },
    result: { type: mongoose.Schema.Types.Mixed, required: true },
  },
  { timestamps: true }
);

export const Trip = mongoose.model('Trip', tripSchema);
