const API_BASE = "http://localhost:8000/api";

export interface ServiceUrl {
  id: string;
  url: string;
  status?: string;
  lastPing?: string;
}

export interface Service {
  id: string;
  name: string;
  urls: ServiceUrl[];
}

export const api = {
  getServices: async (): Promise<Service[]> => {
    const response = await fetch(`${API_BASE}/services`);
    if (!response.ok) throw new Error("Failed to fetch services");
    return response.json();
  },

  addService: async (service: {
    name: string;
    urls: string[];
  }): Promise<Service> => {
    const response = await fetch(`${API_BASE}/services`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(service),
    });
    if (!response.ok) throw new Error("Failed to add service");
    return response.json();
  },

  deleteService: async (id: string): Promise<void> => {
    const response = await fetch(`${API_BASE}/services/${id}`, {
      method: "DELETE",
    });
    if (!response.ok) throw new Error("Failed to delete service");
  },

  pingService: async (serviceId: string, urlId: string): Promise<Service> => {
    const response = await fetch(
      `${API_BASE}/services/${serviceId}/urls/${urlId}/ping`,
      {
        method: "POST",
      },
    );
    if (!response.ok) throw new Error("Failed to ping service");
    return response.json();
  },
};
