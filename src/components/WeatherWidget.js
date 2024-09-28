import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import './WeatherWidget.css';

// Import SVG icons
import clearIcon from '../assets/clear.svg';
import cloudyRainyIcon from '../assets/cloudy-rainy.svg';
import cloudySunnyIcon from '../assets/cloudy-sunny.svg';
import cloudyIcon from '../assets/cloudy.svg';
import nightCloudyIcon from '../assets/night-cloudy.svg';
import nightRainIcon from '../assets/night-rain.svg';
import rainStormIcon from '../assets/rain-storm.svg';
import rainIcon from '../assets/rain.svg';
import thunderIcon from '../assets/thunder.svg';

const API_KEY = '41d2732be9c6b87c0d33d36180edb2b8';
const CITIES = [
  { name: 'New York City', country: 'US' },
  { name: 'London', country: 'UK' },
  { name: 'Tokyo', country: 'JP' },
  { name: 'Sydney', country: 'AU' }
];

const getWeatherIcon = (weatherCode, isNight) => {
  if (isNight) {
    if (weatherCode.includes('cloud')) return nightCloudyIcon;
    if (weatherCode.includes('rain')) return nightRainIcon;
  }
  
  switch (true) {
    case weatherCode.includes('clear'): return clearIcon;
    case weatherCode.includes('rain') && weatherCode.includes('thunder'): return thunderIcon;
    case weatherCode.includes('rain') && weatherCode.includes('heavy'): return rainStormIcon;
    case weatherCode.includes('rain'): return rainIcon;
    case weatherCode.includes('cloud') && weatherCode.includes('sun'): return cloudySunnyIcon;
    case weatherCode.includes('cloud'): return cloudyIcon;
    default: return clearIcon;
  }
};

function WeatherWidget() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0]);
  const [weatherData, setWeatherData] = useState(null);
  const [isNight, setIsNight] = useState(false);
  const [showExtendedForecast, setShowExtendedForecast] = useState(false);

  useEffect(() => {
    const fetchWeatherData = async () => {
      try {
        const response = await axios.get(
          `https://api.openweathermap.org/data/2.5/forecast?q=${selectedCity.name},${selectedCity.country}&units=metric&appid=${API_KEY}`
        );
        
        const cityTimezone = response.data.city.timezone;
        const currentTime = new Date(new Date().getTime() + cityTimezone * 1000 + new Date().getTimezoneOffset() * 60000);
        
        const currentWeather = response.data.list[0];
        
        const hourlyForecast = generateHourlyForecast(response.data.list, currentTime, cityTimezone);
        const extendedForecast = generateExtendedForecast(response.data.list, currentTime, cityTimezone);

        const currentHour = currentTime.getHours();
        setIsNight(currentHour < 6 || currentHour >= 18);

        setWeatherData({
          temperature: Math.round(currentWeather.main.temp),
          icon: getWeatherIcon(currentWeather.weather[0].description.toLowerCase(), isNight),
          description: currentWeather.weather[0].description,
          hourlyForecast,
          extendedForecast,
          currentTime: currentTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
        });
      } catch (error) {
        console.error('Error fetching weather data:', error);
      }
    };

    fetchWeatherData();
  }, [selectedCity]);

  const generateHourlyForecast = (forecastList, currentTime, cityTimezone) => {
    return Array.from({length: 4}, (_, i) => {
      const forecastTime = new Date(currentTime.getTime() + (i + 1) * 3 * 60 * 60 * 1000);
      const forecastData = forecastList.find(item => {
        const itemTime = new Date(item.dt * 1000 + cityTimezone * 1000);
        return itemTime > forecastTime && itemTime <= new Date(forecastTime.getTime() + 3 * 60 * 60 * 1000);
      });
      return {
        time: forecastTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
        temp: Math.round(forecastData ? forecastData.main.temp : forecastList[0].main.temp)
      };
    });
  };

  const generateExtendedForecast = (forecastList, currentTime, cityTimezone) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return Array.from({length: 4}, (_, dayIndex) => {
      const dayForecast = Array.from({length: 8}, (_, hourIndex) => {
        const forecastTime = new Date(currentTime.getTime() + (dayIndex * 24 + hourIndex * 3) * 60 * 60 * 1000);
        const forecastData = forecastList.find(item => {
          const itemTime = new Date(item.dt * 1000 + cityTimezone * 1000);
          return itemTime > forecastTime && itemTime <= new Date(forecastTime.getTime() + 3 * 60 * 60 * 1000);
        });
        return forecastData ? {
          time: forecastTime.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true }),
          temp: Math.round(forecastData.main.temp),
          humidity: forecastData.main.humidity,
          windSpeed: Math.round(forecastData.wind.speed)
        } : null;
      }).filter(Boolean);
      return {
        day: days[new Date(currentTime.getTime() + dayIndex * 24 * 60 * 60 * 1000).getDay()],
        forecast: dayForecast
      };
    });
  };

  useEffect(() => {
    const checkDayNight = () => {
      const currentHour = new Date().getHours();
      setIsNight(currentHour < 6 || currentHour >= 18);
    };

    checkDayNight(); // Check immediately
    const interval = setInterval(checkDayNight, 60000); // Check every minute

    return () => clearInterval(interval); // Cleanup on unmount
  }, []);

  return (
    <div className={`weather-widget ${isNight ? 'night' : 'day'}`}>
      <div className="widget-content">
        <div className="city-tabs">
          {CITIES.map((city) => (
            <button
              key={city.name}
              className={city.name === selectedCity.name ? 'active' : ''}
              onClick={() => setSelectedCity(city)}
            >
              {city.name}
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          {weatherData && (
            <motion.div
              key={selectedCity.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
              className="weather-content"
            >
              <motion.img
                src={weatherData.icon}
                alt={weatherData.description}
                className="weather-icon"
                initial={{ y: -28, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
              />
              <motion.div
                className="weather-details"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
              >
                <div className="current-weather">
                  <div className="weather-info">
                    <h2>Today</h2>
                    <p>{weatherData.currentTime}</p>
                  </div>
                  <div className="temperature">
                    <span>{weatherData.temperature}°C</span>
                  </div>
                </div>
                <div className="forecast-container">
                  <div className="hourly-forecast">
                    {weatherData.hourlyForecast.map((forecast, index) => (
                      <div key={index} className="forecast-item">
                        <p>{forecast.time}</p>
                        <p className="forecast-temp">{forecast.temp}°C</p>
                      </div>
                    ))}
                  </div>
                  <button className="details-button" onClick={() => setShowExtendedForecast(true)}>
                    Click to view details
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {showExtendedForecast && weatherData && (
          <motion.div
            className="extended-forecast-tray"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          >
            <div className="extended-forecast-header">
              <h3>Extended Forecast</h3>
              <button onClick={() => setShowExtendedForecast(false)}>×</button>
            </div>
            <div className="extended-forecast-content">
              {weatherData.extendedForecast.map((day, dayIndex) => (
                <div key={dayIndex} className="extended-forecast-day">
                  <h4>{day.day}</h4>
                  <div className="extended-forecast-hours">
                    {day.forecast.map((hourForecast, hourIndex) => (
                      <div key={hourIndex} className="extended-forecast-hour">
                        <p>{hourForecast.time}</p>
                        <p>{hourForecast.temp}°C</p>
                        <p>{hourForecast.humidity}%</p>
                        <p>{hourForecast.windSpeed} m/s</p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default WeatherWidget;