import { Service, ServiceUrl } from "../services/api";
import "./ServicesTable.css";

interface ServicesTableProps {
  services: Service[];
  onDelete: (id: string) => void;
  onPing: (serviceId: string, urlId: string) => void;
}

const ServicesTable = ({ services, onDelete, onPing }: ServicesTableProps) => {
  const handleDelete = (id: string, serviceName: string) => {
    if (window.confirm(`Are you sure you want to delete "${serviceName}"?`)) {
      onDelete(id);
    }
  };

  const getStatusDisplay = (status: string | undefined) => {
    if (!status) return { class: "unknown", text: "Unknown", originalText: "" };
    if (status.includes("ALIVE"))
      return { class: "online", text: "Online", originalText: status };
    if (status.includes("DEAD"))
      return { class: "offline", text: "Offline", originalText: status };
    return { class: "unknown", text: "Unknown", originalText: status };
  };

  // Helper function to ensure urls is always an array
  const getServiceUrls = (service: Service): ServiceUrl[] => {
    if (!service.urls || !Array.isArray(service.urls)) {
      console.warn(`Service ${service.id} has no valid urls array`, service);
      return [];
    }
    return service.urls;
  };

  if (!Array.isArray(services) || services.length === 0) {
    return (
      <div className="services-table-container">
        <table className="services-table">
          <thead>
            <tr>
              <th>Service Name</th>
              <th>URLs</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={4} className="no-services">
                No services available
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="services-table-container">
      <table className="services-table">
        <thead>
          <tr>
            <th>Service Name</th>
            <th>URLs</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => {
            const urls = getServiceUrls(service);
            return (
              <tr key={service.id}>
                <td>{service.name}</td>
                <td>
                  <div className="urls-list">
                    {urls.length === 0 ? (
                      <div className="url-item">
                        <span className="service-url">No URLs available</span>
                      </div>
                    ) : (
                      urls.map((urlObj) => (
                        <div key={urlObj.id} className="url-item">
                          <a
                            href={urlObj.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="service-url"
                          >
                            {urlObj.url}
                          </a>
                          <button
                            onClick={() => onPing(service.id, urlObj.id)}
                            className="btn btn-ping btn-sm"
                          >
                            Ping
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </td>
                <td>
                  <div className="status-list">
                    {urls.map((urlObj) => {
                      const statusDisplay = getStatusDisplay(urlObj.status);
                      return (
                        <div key={urlObj.id} className="status-container">
                          <span
                            className={`status-badge status-${statusDisplay.class}`}
                          >
                            {statusDisplay.text}
                          </span>
                          {statusDisplay.originalText && (
                            <span className="status-details">
                              ({statusDisplay.originalText})
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </td>
                <td className="action-buttons">
                  <button
                    onClick={() => handleDelete(service.id, service.name)}
                    className="btn btn-delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default ServicesTable;
