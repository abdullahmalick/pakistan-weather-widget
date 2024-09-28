import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

interface WeatherData {
  city: string;
  temperature: number;
  description: string;
  icon: string;
  hourlyForecast: Array<{ time: string; temp: number }>;
}

const API_KEY = '41d2732be9c6b87c0d33d36180edb2b8';
const cities = ['Islamabad', 'Karachi', 'Peshawar', 'Quetta'];

export function useWeather() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const searchParams = useSearchParams();
  const city = searchParams.get('city') || 'Islamabad';

  useEffect(() => {
    async function fetchWeather() {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${city}&appid=${API_KEY}&units=metric`
        );
        if (!response.ok) {
          throw new Error('Failed to fetch weather data');
        }
        const data = await response.json();
        
        const currentWeather = data.list[0];
        const hourlyForecast = data.list.slice(0, 4).map((item: any) => ({
          time: new Date(item.dt * 1000).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
          temp: Math.round(item.main.temp)
        }));

        setWeatherData({
          city: data.city.name,
          temperature: Math.round(currentWeather.main.temp),
          description: currentWeather.weather[0].description,
          icon: currentWeather.weather[0].icon,
          hourlyForecast
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setIsLoading(false);
      }
    }

    fetchWeather();
  }, [city]);

  return { weatherData, isLoading, error, cities };
}
