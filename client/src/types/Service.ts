export interface Service {
  id: string;
  name: string;
  url: string;
  status: "online" | "offline" | "unknown";
  lastChecked: string;
  lastModified: string;
}
