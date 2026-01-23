const API_URL = "https://omarkh.gt.tc/api";

export async function api(path: string, data?: any) {
  const res = await fetch(`${API_URL}${path}`, {
    method: data ? "POST" : "GET",
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined
  });

  if (!res.ok) throw new Error("API error");
  return res.json();
}
