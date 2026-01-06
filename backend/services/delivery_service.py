"""
Delivery Service - Calculate delivery distance and fees using FREE APIs
- Nominatim (OpenStreetMap) for geocoding - FREE
- Haversine formula for distance calculation - No API needed
"""

import math
import httpx
from typing import Optional, Dict, Any, List


class DeliveryService:
    def __init__(self):
        # Nominatim (OpenStreetMap) - FREE geocoding
        self.nominatim_url = "https://nominatim.openstreetmap.org/search"
        # User-Agent required by Nominatim usage policy
        self.headers = {
            "User-Agent": "SmartMenuNZ/1.0 (contact@smartmenu.co.nz)"
        }

    def haversine_distance(
        self,
        lat1: float,
        lon1: float,
        lat2: float,
        lon2: float
    ) -> float:
        """
        Calculate the great-circle distance between two points using Haversine formula.

        Args:
            lat1, lon1: First point coordinates
            lat2, lon2: Second point coordinates

        Returns:
            Distance in kilometers (straight line)
        """
        R = 6371  # Earth's radius in kilometers

        # Convert to radians
        lat1_rad = math.radians(lat1)
        lat2_rad = math.radians(lat2)
        delta_lat = math.radians(lat2 - lat1)
        delta_lon = math.radians(lon2 - lon1)

        # Haversine formula
        a = math.sin(delta_lat / 2) ** 2 + \
            math.cos(lat1_rad) * math.cos(lat2_rad) * \
            math.sin(delta_lon / 2) ** 2
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

        return R * c

    def estimate_road_distance(self, straight_line_km: float) -> float:
        """
        Estimate actual road distance from straight-line distance.
        Roads are typically 1.2-1.4x longer than straight line.
        Using 1.3 as a reasonable average for urban areas.
        """
        return round(straight_line_km * 1.3, 2)

    def estimate_duration(self, distance_km: float) -> int:
        """
        Estimate travel duration based on distance.
        Assumes average speed of 35 km/h for city driving.
        """
        avg_speed_kmh = 35
        duration_hours = distance_km / avg_speed_kmh
        duration_minutes = round(duration_hours * 60)
        return max(5, duration_minutes)  # Minimum 5 minutes

    async def geocode_address(self, address: str) -> Optional[Dict[str, Any]]:
        """
        Convert an address to latitude/longitude using Nominatim (OpenStreetMap) - FREE

        Args:
            address: The address string to geocode

        Returns:
            Dict with 'lat', 'lng', 'formatted_address' or None if failed
        """
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    self.nominatim_url,
                    params={
                        "q": address,
                        "format": "json",
                        "limit": 1,
                        "countrycodes": "nz",  # Prioritize New Zealand
                        "addressdetails": 1
                    },
                    headers=self.headers,
                    timeout=10.0
                )

                data = response.json()

                if data and len(data) > 0:
                    result = data[0]
                    return {
                        "lat": float(result["lat"]),
                        "lng": float(result["lon"]),
                        "formatted_address": result.get("display_name", address)
                    }
                else:
                    print(f"⚠️ Geocoding failed: No results for '{address}'")
                    return None

        except Exception as e:
            print(f"❌ Geocoding error: {str(e)}")
            return None

    async def calculate_distance(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float
    ) -> Optional[Dict[str, Any]]:
        """
        Calculate distance between two points using Haversine formula - FREE

        Args:
            origin_lat: Origin latitude (restaurant)
            origin_lng: Origin longitude (restaurant)
            dest_lat: Destination latitude (customer)
            dest_lng: Destination longitude (customer)

        Returns:
            Dict with 'distance_km', 'distance_text', 'duration_minutes', 'duration_text'
        """
        try:
            # Calculate straight-line distance
            straight_line_km = self.haversine_distance(
                origin_lat, origin_lng,
                dest_lat, dest_lng
            )

            # Estimate road distance (multiply by 1.3)
            distance_km = self.estimate_road_distance(straight_line_km)

            # Estimate duration
            duration_minutes = self.estimate_duration(distance_km)

            return {
                "distance_km": distance_km,
                "distance_text": f"{distance_km} km",
                "duration_minutes": duration_minutes,
                "duration_text": f"{duration_minutes} mins"
            }

        except Exception as e:
            print(f"❌ Distance calculation error: {str(e)}")
            return None

    def calculate_delivery_fee(
        self,
        distance_km: float,
        delivery_rates: List[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        """
        Calculate delivery fee based on distance and restaurant's delivery rates

        Args:
            distance_km: Distance in kilometers
            delivery_rates: List of {distance_km: float, price: float} sorted by distance

        Returns:
            Dict with 'fee', 'tier_distance', 'is_within_range'
        """
        if not delivery_rates:
            return {
                "fee": 0,
                "tier_distance": None,
                "is_within_range": True,
                "message": "No delivery rates configured"
            }

        # Sort by distance_km ascending
        sorted_rates = sorted(delivery_rates, key=lambda x: x.get("distance_km", 0))

        # Find the appropriate tier
        for rate in sorted_rates:
            tier_distance = rate.get("distance_km", 0)
            tier_price = rate.get("price", 0)

            if distance_km <= tier_distance:
                return {
                    "fee": tier_price,
                    "tier_distance": tier_distance,
                    "is_within_range": True,
                    "message": f"Delivery fee for up to {tier_distance} km"
                }

        # Distance exceeds all tiers
        max_tier = sorted_rates[-1]
        return {
            "fee": None,
            "tier_distance": max_tier.get("distance_km"),
            "is_within_range": False,
            "message": f"Sorry, we only deliver within {max_tier.get('distance_km')} km"
        }

    async def calculate_delivery_for_address(
        self,
        restaurant_lat: float,
        restaurant_lng: float,
        customer_address: str,
        delivery_rates: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Complete delivery calculation: geocode address, calculate distance, determine fee

        Args:
            restaurant_lat: Restaurant latitude
            restaurant_lng: Restaurant longitude
            customer_address: Customer's delivery address
            delivery_rates: Restaurant's delivery rate tiers

        Returns:
            Complete delivery calculation result
        """
        # Step 1: Geocode customer address using Nominatim (FREE)
        geocode_result = await self.geocode_address(customer_address)

        if not geocode_result:
            return {
                "success": False,
                "error": "Could not find the address. Please enter a valid New Zealand address.",
                "error_code": "GEOCODE_FAILED"
            }

        customer_lat = geocode_result["lat"]
        customer_lng = geocode_result["lng"]
        formatted_address = geocode_result["formatted_address"]

        # Step 2: Calculate distance using Haversine (FREE - no API)
        distance_result = await self.calculate_distance(
            restaurant_lat, restaurant_lng,
            customer_lat, customer_lng
        )

        if not distance_result:
            return {
                "success": False,
                "error": "Could not calculate distance. Please try again.",
                "error_code": "DISTANCE_FAILED"
            }

        distance_km = distance_result["distance_km"]

        # Step 3: Calculate fee based on delivery rates
        fee_result = self.calculate_delivery_fee(distance_km, delivery_rates)

        return {
            "success": True,
            "customer_location": {
                "lat": customer_lat,
                "lng": customer_lng,
                "formatted_address": formatted_address
            },
            "distance": {
                "km": distance_km,
                "text": distance_result["distance_text"]
            },
            "duration": {
                "minutes": distance_result["duration_minutes"],
                "text": distance_result["duration_text"]
            },
            "delivery_fee": fee_result["fee"],
            "is_within_range": fee_result["is_within_range"],
            "tier_distance": fee_result["tier_distance"],
            "message": fee_result["message"]
        }


# Singleton instance
delivery_service = DeliveryService()
