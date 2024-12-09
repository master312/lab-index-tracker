import { useState, useEffect } from "react";
import Header from "./components/Header";
import ServicesTable from "./components/ServicesTable";
import AddServiceForm from "./components/AddServiceForm";
import { api, Service } from "./services/api";
import "./App.css";

function App() {
  const [services, setServices] = useState<Service[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const data = await api.getServices();
      setServices(data);
      setError(null);
    } catch (err) {
      setError("Failed to fetch services");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddService = async ({
    name,
    urls,
  }: {
    name: string;
    urls: string[];
  }) => {
    try {
      const newService = await api.addService({ name, urls });
      setServices([...services, newService]);
      setError(null);
    } catch (err) {
      setError("Failed to add service");
      console.error(err);
    }
  };

  const handleDeleteService = async (id: string) => {
    try {
      await api.deleteService(id);
      setServices(services.filter((service) => service.id !== id));
      setError(null);
    } catch (err) {
      setError("Failed to delete service");
      console.error(err);
    }
  };

  const handlePingService = async (serviceId: string, urlId: string) => {
    try {
      console.log(serviceId, urlId);
      const updatedService = await api.pingService(serviceId, urlId);
      setServices(
        services.map((service) =>
          service.id === serviceId ? updatedService : service,
        ),
      );
      setError(null);
    } catch (err) {
      setError("Failed to ping service");
      console.error(err);
    }
  };

  if (loading) {
    return <div className="app">Loading...</div>;
  }

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        {error && <div className="error-message">{error}</div>}
        <ServicesTable
          services={services}
          onDelete={handleDeleteService}
          onPing={handlePingService}
        />
        <AddServiceForm onAdd={handleAddService} />
      </main>
    </div>
  );
}

export default App;
