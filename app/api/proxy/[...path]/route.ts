import { NextRequest, NextResponse } from "next/server";

const BACKEND_URL = "https://test-account.amdream.us/api";

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const path = request.nextUrl.pathname.split("/api/proxy/")[1];
    const searchParams = request.nextUrl.searchParams.toString();
    const url = `${BACKEND_URL}/${path}${searchParams ? `?${searchParams}` : ""}`;

    const response = await fetch(url, {
      headers: {
        Authorization: request.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.log("Non-JSON response from backend:", {
        url,
        status: response.status,
        statusText: response.statusText,
        contentType,
        headers: Object.fromEntries(response.headers.entries()),
        body: text.substring(0, 500), // Log first 500 chars of response
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
    console.log("Proxy GET Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      url: `${BACKEND_URL}/${request.nextUrl.pathname.split("/api/proxy/")[1]}`,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch from backend",
        details: error instanceof Error ? error : "Unknown error",
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

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.log("Non-JSON response:", {
        url,
        status: response.status,
        contentType,
        body: text.substring(0, 500), // Log first 500 chars of response
      });
      return NextResponse.json(
        {
          error: "Invalid response from backend",
          details: "Expected JSON response but got " + contentType,
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.log("Proxy POST Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch from backend",
        details: error instanceof Error ? error : "Unknown error",
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

    const response = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
    });

    // Log response details for debugging
    console.log("PUT Response:", {
      url,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.log("Non-JSON response:", {
        url,
        status: response.status,
        contentType,
        body: text.substring(0, 500), // Log first 500 chars of response
      });
      return NextResponse.json(
        {
          error: "Invalid response from backend",
          details: "Expected JSON response but got " + contentType,
        },
        { status: 500 }
      );
    }

    const data = await response.json();

    // Check if the response indicates an error
    if (!response.ok) {
      console.log("Error response from backend:", {
        url,
        status: response.status,
        statusText: response.statusText,
        data,
      });
      return NextResponse.json(
        {
          error: "Backend request failed",
          details: data,
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.log("Proxy PUT Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch from backend",
        details: error instanceof Error ? error : "Unknown error",
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const path = request.nextUrl.pathname.split("/api/proxy/")[1];
    const url = `${BACKEND_URL}/${path}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: request.headers.get("Authorization") || "",
        "Content-Type": "application/json",
      },
    });

    // Check if response is JSON
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.log("Non-JSON response:", {
        url,
        status: response.status,
        contentType,
        body: text.substring(0, 500), // Log first 500 chars of response
      });
      return NextResponse.json(
        {
          error: "Invalid response from backend",
          details: "Expected JSON response but got " + contentType,
        },
        { status: 500 }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: response.status });
  } catch (error) {
    console.log("Proxy DELETE Error:", {
      error: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
    });
    return NextResponse.json(
      {
        error: "Failed to fetch from backend",
        details: error instanceof Error ? error : "Unknown error",
      },
      { status: 500 }
    );
  }
}
