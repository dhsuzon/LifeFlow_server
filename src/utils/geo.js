import { districts, upazilas } from "../data/bdgeoData.js";

export const isValidLocation = (districtName, upazilaName) => {
  const district = districts.find((item) => item.name === districtName);

  const validUpazila =
    district &&
    upazilas.some(
      (item) =>
        item.name === upazilaName &&
        String(item.district_id) === String(district.id),
    );

  return Boolean(district && validUpazila);
};
