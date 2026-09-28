export const RESOURCE_TYPES = [
  { value: 'boat', label: 'Boat' },
  { value: 'generator', label: 'Generator' },
  { value: 'water_pump', label: 'Water pump' },
  { value: 'first_aid_kit', label: 'First-aid kit' },
  { value: 'dry_ration', label: 'Dry ration' },
  { value: 'drinking_water', label: 'Drinking water' },
  { value: 'blanket', label: 'Blanket' },
  { value: 'torch', label: 'Torch' },
  { value: 'medicine', label: 'Medicine' },
  { value: 'vehicle', label: 'Vehicle' },
  { value: 'other', label: 'Other' },
];

export const typeLabel = (value) =>
  RESOURCE_TYPES.find((t) => t.value === value)?.label || value;