
const CACHE_DURATION = 10 * 60;

export default async (request) => {
    const url = new URL(request.url);
    const city = url.searchParams.get("q");

    if (!city || !city.trim()) {
        return Response.json(
            { error: { message: "Please enter a city name." } },
            { status: 400 }
        );
    }

    const apiKey = Netlify.env.get("WEATHERAPI_KEY");

    if (!apiKey) {
        return Response.json(
            { error: { message: "Weather service is not configured yet." } },
            { status: 500 }
        );
    }

    const apiURL = new URL("https://api.weatherapi.com/v1/forecast.json");
    apiURL.searchParams.set("key", apiKey);
    apiURL.searchParams.set("q", city.trim());
    apiURL.searchParams.set("days", "3");
    apiURL.searchParams.set("aqi", "no");
    apiURL.searchParams.set("alerts", "no");

    try {
        const response = await fetch(apiURL.toString());

        const data = await response.json();

        if (!response.ok) {
            return Response.json(
                {
                    error: {
                        message: data.error?.message || "Weather information unavailable."
                    }
                },
                { status: response.status }
            );
        }

        return Response.json(
            { data },
            {
                status: 200,
                headers: {
                    "Cache-Control": `public, max-age=${CACHE_DURATION}, s-maxage=${CACHE_DURATION}`
                }
            }
        );

    } catch (error) {
        return Response.json(
            { error: { message: "Unable to connect to the weather service." } },
            { status: 502 }
        );
    }
};
