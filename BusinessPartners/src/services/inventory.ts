import BASE_URL from "@/src/config/config";

export async function fetchCategories(businessId: number, token: string) {
  const res = await fetch(`${BASE_URL}/api/inventory/business/${businessId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function createCategory(payload: any, image: any, token: string) {
  const formData = new FormData();

  formData.append("category", JSON.stringify(payload));

  if (image) {
    formData.append("file", {
      uri: image.uri,
      name: image.fileName || `category_${Date.now()}.jpg`,
      type: image.mimeType || "image/jpeg",
    } as any);
  }

  const res = await fetch(`${BASE_URL}/api/inventory/category`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error(await res.text());

  return res.json();
}
export async function changeStock(payload: any, token: string) {
  const res = await fetch(`${BASE_URL}/api/inventory/stock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchLogs(categoryId: string, token: string) {
  const res = await fetch(
    `${BASE_URL}/api/inventory/category/${categoryId}/logs`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function fetchCategoryById(categoryId: number, token: string) {
  const res = await fetch(`${BASE_URL}/api/inventory/category/${categoryId}`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) throw new Error("Failed to load category");

  return res.json();
}
export async function updateCategory(
  categoryId: number,
  payload: any,
  image: any,
  token: string,
) {
  const formData = new FormData();

  // ✅ SAME AS TRANSACTION
  formData.append("category", JSON.stringify(payload));

  if (image) {
    formData.append("file", {
      uri: image.uri,
      name: image.fileName || `category_${Date.now()}.jpg`,
      type: image.mimeType || "image/jpeg",
    } as any);
  }

  const res = await fetch(`${BASE_URL}/api/inventory/category/${categoryId}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!res.ok) throw new Error(await res.text());

  return res.json();
}
