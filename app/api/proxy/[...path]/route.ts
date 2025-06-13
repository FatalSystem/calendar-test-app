import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://test-account.amdream.us/api";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const path = request.nextUrl.pathname.split("/api/proxy/")[1];
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ""}`;

    console.log("🔍 Proxy GET request:", { 
      url, 
      path,
      headers: Object.fromEntries(request.headers.entries())
    });

    const response = await fetch(url, {
      headers: {
        Authorization: request.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
    });

    console.log("🔍 Backend response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Non-JSON response from backend:", {
        url,
        status: response.status,
        statusText: response.statusText,
        contentType,
        headers: Object.fromEntries(response.headers.entries()),
        body: text.substring(0, 500),
      });
      return NextResponse.json(
        {
          error: "Invalid response from backend",
          details: `Expected JSON response but got ${contentType}. Status: ${response.status} ${response.statusText}`,
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("❌ Proxy GET Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      url: `${BACKEND_URL}/${request.nextUrl.pathname.split("/api/proxy/")[1]}`,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch from backend",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const path = request.nextUrl.pathname.split("/api/proxy/")[1];
    const url = `${BACKEND_URL}/${path}`;
    const body = await request.json();

    console.log("🔍 Proxy POST request:", { 
      url, 
      path, 
      body,
      headers: Object.fromEntries(request.headers.entries())
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("🔍 Backend response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Non-JSON response:", {
        url,
        status: response.status,
        contentType,
        body: text.substring(0, 500),
      });
      return NextResponse.json(
        {
          error: "Invalid response from backend",
          details: `Expected JSON response but got ${contentType}. Status: ${response.status} ${response.statusText}`,
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("❌ Proxy POST Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      url: `${BACKEND_URL}/${request.nextUrl.pathname.split("/api/proxy/")[1]}`,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch from backend",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest): Promise<NextResponse> {
  try {
    const path = request.nextUrl.pathname.split("/api/proxy/")[1];
    const url = `${BACKEND_URL}/${path}`;
    const body = await request.json();

    console.log("🔍 Proxy PUT request:", { 
      url, 
      path, 
      body,
      headers: Object.fromEntries(request.headers.entries())
    });

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("🔍 Backend response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Non-JSON response:", {
        url,
        status: response.status,
        contentType,
        body: text.substring(0, 500),
      });
      return NextResponse.json(
        {
          error: "Invalid response from backend",
          details: `Expected JSON response but got ${contentType}. Status: ${response.status} ${response.statusText}`,
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("❌ Proxy PUT Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      url: `${BACKEND_URL}/${request.nextUrl.pathname.split("/api/proxy/")[1]}`,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch from backend",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const path = request.nextUrl.pathname.split("/api/proxy/")[1];
    const url = `${BACKEND_URL}/${path}`;

    console.log("🔍 Proxy DELETE request:", { 
      url, 
      path,
      headers: Object.fromEntries(request.headers.entries())
    });

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
    });

    console.log("🔍 Backend response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Non-JSON response:", {
        url,
        status: response.status,
        contentType,
        body: text.substring(0, 500),
      });
      return NextResponse.json(
        {
          error: "Invalid response from backend",
          details: `Expected JSON response but got ${contentType}. Status: ${response.status} ${response.statusText}`,
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("❌ Proxy DELETE Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      url: `${BACKEND_URL}/${request.nextUrl.pathname.split("/api/proxy/")[1]}`,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch from backend",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const path = request.nextUrl.pathname.split("/api/proxy/")[1];
    const url = `${BACKEND_URL}/${path}`;
    const body = await request.json();

    console.log("🔍 Proxy PATCH request:", { 
      url, 
      path, 
      body,
      headers: Object.fromEntries(request.headers.entries())
    });

    const response = await fetch(url, {
      method: "PATCH",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log("🔍 Backend response:", {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("❌ Non-JSON response:", {
        url,
        status: response.status,
        contentType,
        body: text.substring(0, 500),
      });
      return NextResponse.json(
        {
          error: "Invalid response from backend",
          details: `Expected JSON response but got ${contentType}. Status: ${response.status} ${response.statusText}`,
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.error("❌ Proxy PATCH Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      url: `${BACKEND_URL}/${request.nextUrl.pathname.split("/api/proxy/")[1]}`,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch from backend",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}
