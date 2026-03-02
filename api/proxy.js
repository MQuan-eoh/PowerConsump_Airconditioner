export default async function handler(req, res) {
  // CORS Headers for Vercel
  res.setHeader("Access-Control-Allow-Credentials", true);
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  // Handle OPTIONS request
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // The external API URL is passed via a query parameter 'path'
  // e.g. /api/proxy?path=/property_manager/iot_dashboard/filters/owner/chips/?unit=10922
  const { path, ...queryParams } = req.query;

  if (!path) {
    return res.status(400).json({ error: "Missing 'path' parameter" });
  }

  // Reconstruct the full backend URL
  const backendBaseUrl = "https://backend.eoh.io/api";
  
  // Create URL object to safely append query parameters
  const targetUrl = new URL(`${backendBaseUrl}${path}`);
  Object.keys(queryParams).forEach(key => {
     targetUrl.searchParams.append(key, queryParams[key]);
  });

  // Get the secret token from Environment Variables in Vercel
  // You will set ERA_API_TOKEN in Vercel's dashboard
  const token = process.env.ERA_API_TOKEN || "Token a159b7047b33aebfdb2e83f614c5049e5d760d6d";

  try {
    const response = await fetch(targetUrl.toString(), {
      method: req.method,
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "Authorization": token, // Securely injected on the server
      },
      // Only include body if it's not a GET/HEAD request
      ...(req.method !== 'GET' && req.method !== 'HEAD' && req.body && { body: JSON.stringify(req.body) })
    });

    const data = await response.json();
    
    // Forward the status code and data
    res.status(response.status).json(data);
  } catch (error) {
    console.error("Vercel Proxy Error:", error);
    res.status(500).json({ error: "Failed to proxy request" });
  }
}
