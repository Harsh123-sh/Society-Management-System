import { useState } from "react";
import { flats, idTypes, purposes } from "../data/navigation";

function VisitorQuickEntryForm() {
  const [formData, setFormData] = useState({
    visitorName: "",
    phone: "",
    flat: "",
    purpose: "",
    idType: "",
    idNumber: "",
    photo: null,
  });

  const [showSuccess, setShowSuccess] = useState(false);
  const [frequentVisitor, setFrequentVisitor] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Detect frequent visitor
    if (name === "visitorName" && value.length > 2) {
      setFrequentVisitor(true);
    }
  };

  const handlePhotoCapture = () => {
    // Simulate photo upload
    setFormData({ ...formData, photo: true });
  };

  const handleAddVisitor = (e) => {
    e.preventDefault();
    if (!formData.visitorName || !formData.phone || !formData.flat) {
      alert("Please fill all required fields!");
      return;
    }
    setShowSuccess(true);
    setTimeout(() => {
      setFormData({
        visitorName: "",
        phone: "",
        flat: "",
        purpose: "",
        idType: "",
        idNumber: "",
        photo: null,
      });
      setShowSuccess(false);
      setFrequentVisitor(false);
    }, 2000);
  };

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
      <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        ⚡ Quick Visitor Entry
      </h2>

      {/* AI Suggestion */}
      {frequentVisitor && (
        <div className="mb-6 p-4 rounded-lg bg-blue-50 border-l-4 border-blue-500 flex items-start gap-3">
          <span className="text-2xl">ℹ️</span>
          <div>
            <p className="font-semibold text-blue-900">Frequent Visitor Detected</p>
            <p className="text-sm text-blue-700">This visitor has 5 previous entries for Flat A-101</p>
          </div>
        </div>
      )}

      <form onSubmit={handleAddVisitor} className="grid gap-4 md:grid-cols-2">
        {/* Visitor Name */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-2">
            Visitor Name *
          </label>
          <input
            type="text"
            name="visitorName"
            value={formData.visitorName}
            onChange={handleInputChange}
            placeholder="Full name"
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-lg"
          />
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-2">
            Phone Number *
          </label>
          <input
            type="tel"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            placeholder="+91 XXXXXXXXXX"
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-lg"
          />
        </div>

        {/* Flat Number */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-2">
            Flat Number *
          </label>
          <select
            name="flat"
            value={formData.flat}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold text-lg"
          >
            <option value="">Select Flat</option>
            {flats.map((flat) => (
              <option key={flat.id} value={flat.number}>
                {flat.number}
              </option>
            ))}
          </select>
        </div>

        {/* Purpose */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-2">
            Purpose
          </label>
          <select
            name="purpose"
            value={formData.purpose}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
          >
            <option value="">Select Purpose</option>
            <option value="Meeting">Meeting</option>
            <option value="Delivery">Delivery</option>
            <option value="Repair">Repair Work</option>
            <option value="Guest">Guest</option>
            <option value="Tutor">Tutor</option>
            <option value="Maintenance">Maintenance</option>
          </select>
        </div>

        {/* ID Type */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-2">
            ID Type
          </label>
          <select
            name="idType"
            value={formData.idType}
            onChange={handleInputChange}
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
          >
            <option value="">Select ID Type</option>
            <option value="Aadhar">Aadhar</option>
            <option value="PAN">PAN</option>
            <option value="License">Driving License</option>
            <option value="Passport">Passport</option>
          </select>
        </div>

        {/* ID Number */}
        <div>
          <label className="block text-sm font-bold text-slate-900 mb-2">
            ID Number
          </label>
          <input
            type="text"
            name="idNumber"
            value={formData.idNumber}
            onChange={handleInputChange}
            placeholder="ID number"
            className="w-full px-4 py-3 border-2 border-slate-300 rounded-lg focus:border-blue-500 focus:outline-none font-semibold"
          />
        </div>

        {/* Photo Section */}
        <div className="md:col-span-2">
          <label className="block text-sm font-bold text-slate-900 mb-2">
            Photo (Optional)
          </label>
          <div className="flex gap-3">
            <button
              type="button"
              onClick={handlePhotoCapture}
              className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 font-semibold text-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              📷 {formData.photo ? "Photo Added" : "Take Photo"}
            </button>
            <button
              type="button"
              className="flex-1 px-4 py-3 border-2 border-slate-300 rounded-lg hover:bg-slate-50 font-semibold text-slate-700 transition-colors flex items-center justify-center gap-2"
            >
              🔍 Scan QR
            </button>
          </div>
        </div>

        {/* Buttons */}
        <div className="md:col-span-2 flex gap-3">
          <button
            type="submit"
            className="flex-1 px-6 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:shadow-lg transition-all text-lg"
          >
            ✓ Add Visitor
          </button>
          <button
            type="button"
            className="flex-1 px-6 py-4 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:shadow-lg transition-all text-lg"
          >
            📋 Quick Check-in
          </button>
        </div>
      </form>

      {/* Success Message */}
      {showSuccess && (
        <div className="mt-4 p-4 rounded-lg bg-green-50 border-2 border-green-500 flex items-start gap-3">
          <span className="text-3xl">✓</span>
          <div>
            <p className="font-bold text-green-900">Visitor Added Successfully!</p>
            <p className="text-sm text-green-700">
              {formData.visitorName} has been registered for {formData.flat}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default VisitorQuickEntryForm;
