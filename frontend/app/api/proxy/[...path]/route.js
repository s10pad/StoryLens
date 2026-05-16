const BACKEND = process.env.BACKEND_URL || "http://localhost:3001";

export async function POST(request, { params }) {
  const path = "/" + (await params).path.join("/");
  const body = await request.text();

  const upstream = await fetch(`${BACKEND}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });

  const data = await upstream.json();
  return Response.json(data, { status: upstream.status });
}
