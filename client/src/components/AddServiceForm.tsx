import { useState } from "react";
import "./AddServiceForm.css";

interface AddServiceFormProps {
  onAdd: (service: { name: string; urls: string[] }) => void;
}

const AddServiceForm = ({ onAdd }: AddServiceFormProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [name, setName] = useState("");
  const [urls, setUrls] = useState<string[]>([""]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && urls.every((url) => url.trim())) {
      onAdd({ name, urls: urls.filter((url) => url.trim()) });
      setName("");
      setUrls([""]);
      setIsExpanded(false);
    }
  };

  const handleUrlChange = (index: number, value: string) => {
    const newUrls = [...urls];
    newUrls[index] = value;
    setUrls(newUrls);
  };

  const addUrlField = () => {
    setUrls([...urls, ""]);
  };

  const removeUrlField = (index: number) => {
    if (urls.length > 1) {
      const newUrls = urls.filter((_, i) => i !== index);
      setUrls(newUrls);
    }
  };

  return (
    <div className="add-service-form-container">
      <button
        className="toggle-form-btn"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? "Cancel" : "Add New Service"}
      </button>

      {isExpanded && (
        <form onSubmit={handleSubmit} className="add-service-form">
          <div className="form-group">
            <label htmlFor="name">Service Name:</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div className="form-group urls-group">
            <label>Service URLs:</label>
            {urls.map((url, index) => (
              <div key={index} className="url-input-group">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => handleUrlChange(index, e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="remove-url-btn"
                  onClick={() => removeUrlField(index)}
                  disabled={urls.length === 1}
                >
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="add-url-btn" onClick={addUrlField}>
              Add Another URL
            </button>
          </div>

          <button type="submit" className="submit-btn">
            Add Service
          </button>
        </form>
      )}
    </div>
  );
};

export default AddServiceForm;
