"""
Analytics Service - Generate business insights and reports
"""
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta
from collections import defaultdict
import json
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class AnalyticsService:
    """Generate analytics and reports for restaurants"""
    
    def __init__(self):
        try:
            from supabase import create_client
            supabase_url = os.getenv('SUPABASE_URL') or os.getenv('NEXT_PUBLIC_SUPABASE_URL')
            supabase_key = (
                os.getenv('SUPABASE_SERVICE_ROLE_KEY') or 
                os.getenv('SUPABASE_KEY') or 
                os.getenv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
            )
            
            if supabase_url and supabase_key:
                self.supabase = create_client(supabase_url, supabase_key)
                print("✅ Analytics Service: Supabase client initialized")
            else:
                self.supabase = None
                print("⚠️ Analytics Service: Supabase credentials not found")
                print(f"   SUPABASE_URL: {'✅' if supabase_url else '❌'}")
                print(f"   SUPABASE_KEY: {'✅' if supabase_key else '❌'}")
        except Exception as e:
            print(f"⚠️ Failed to initialize AnalyticsService: {str(e)}")
            self.supabase = None
    
    def get_revenue_stats(
        self,
        restaurant_id: str,
        start_date: Optional[datetime] = None,
        end_date: Optional[datetime] = None
    ) -> Dict[str, Any]:
        """
        Get revenue statistics for a date range
        
        Args:
            restaurant_id: Restaurant ID
            start_date: Start date (default: 30 days ago)
            end_date: End date (default: now)
            
        Returns:
            Dictionary with revenue stats
        """
        if not self.supabase:
            return {"error": "Database not available"}
        
        # Default to last 30 days
        if not end_date:
            end_date = datetime.now()
        if not start_date:
            start_date = end_date - timedelta(days=30)
        
        try:
            # Query orders within date range
            response = self.supabase.table('orders').select('*').eq(
                'restaurant_id', restaurant_id
            ).gte(
                'created_at', start_date.isoformat()
            ).lte(
                'created_at', end_date.isoformat()
            ).in_(
                'status', ['completed', 'ready', 'preparing']  # Exclude cancelled
            ).execute()
            
            orders = response.data if response.data else []
            
            # Calculate stats
            total_revenue = sum(order.get('total_price', 0) for order in orders)
            total_orders = len(orders)
            avg_order_value = total_revenue / total_orders if total_orders > 0 else 0
            
            # Group by date for daily revenue
            daily_revenue = defaultdict(float)
            daily_orders = defaultdict(int)
            
            for order in orders:
                order_date = order.get('created_at', '')[:10]  # YYYY-MM-DD
                daily_revenue[order_date] += order.get('total_price', 0)
                daily_orders[order_date] += 1
            
            # Convert to sorted list
            daily_data = [
                {
                    'date': date,
                    'revenue': revenue,
                    'orders': daily_orders[date]
                }
                for date, revenue in sorted(daily_revenue.items())
            ]
            
            # Service type breakdown
            service_type_revenue = defaultdict(float)
            service_type_orders = defaultdict(int)
            
            for order in orders:
                service_type = order.get('service_type', 'dine_in')
                service_type_revenue[service_type] += order.get('total_price', 0)
                service_type_orders[service_type] += 1
            
            service_breakdown = [
                {
                    'type': stype,
                    'revenue': revenue,
                    'orders': service_type_orders[stype],
                    'percentage': (revenue / total_revenue * 100) if total_revenue > 0 else 0
                }
                for stype, revenue in service_type_revenue.items()
            ]
            
            return {
                'success': True,
                'period': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat(),
                    'days': (end_date - start_date).days
                },
                'summary': {
                    'total_revenue': round(total_revenue, 2),
                    'total_orders': total_orders,
                    'average_order_value': round(avg_order_value, 2)
                },
                'daily_data': daily_data,
                'service_breakdown': service_breakdown
            }
            
        except Exception as e:
            print(f"❌ Error getting revenue stats: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_popular_items(
        self,
        restaurant_id: str,
        days: int = 30,
        limit: int = 10
    ) -> Dict[str, Any]:
        """
        Get most popular menu items
        
        Args:
            restaurant_id: Restaurant ID
            days: Number of days to analyze
            limit: Number of items to return
            
        Returns:
            Dictionary with popular items
        """
        if not self.supabase:
            return {"error": "Database not available"}
        
        try:
            start_date = datetime.now() - timedelta(days=days)
            
            # Get orders with items
            response = self.supabase.table('orders').select('items').eq(
                'restaurant_id', restaurant_id
            ).gte(
                'created_at', start_date.isoformat()
            ).in_(
                'status', ['completed', 'ready', 'preparing']
            ).execute()
            
            orders = response.data if response.data else []
            
            # Count item frequencies
            item_stats = defaultdict(lambda: {'count': 0, 'revenue': 0, 'name': ''})
            
            for order in orders:
                items = order.get('items', [])
                if isinstance(items, str):
                    try:
                        items = json.loads(items)
                    except:
                        items = []
                
                for item in items:
                    menu_id = item.get('menu_id', 'unknown')
                    quantity = item.get('quantity', 1)
                    price = item.get('price', 0)
                    name = item.get('nameEn') or item.get('name', 'Unknown')
                    
                    item_stats[menu_id]['count'] += quantity
                    item_stats[menu_id]['revenue'] += price * quantity
                    item_stats[menu_id]['name'] = name
            
            # Convert to sorted list
            popular_items = [
                {
                    'menu_id': menu_id,
                    'name': stats['name'],
                    'orders_count': stats['count'],
                    'revenue': round(stats['revenue'], 2)
                }
                for menu_id, stats in item_stats.items()
            ]
            
            # Sort by orders count
            popular_items.sort(key=lambda x: x['orders_count'], reverse=True)
            popular_items = popular_items[:limit]
            
            return {
                'success': True,
                'period_days': days,
                'items': popular_items
            }
            
        except Exception as e:
            print(f"❌ Error getting popular items: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }
    
    def get_order_trends(
        self,
        restaurant_id: str,
        days: int = 30
    ) -> Dict[str, Any]:
        """
        Get order trends (hourly distribution, peak times)
        
        Args:
            restaurant_id: Restaurant ID
            days: Number of days to analyze
            
        Returns:
            Dictionary with order trends
        """
        if not self.supabase:
            return {"error": "Database not available"}
        
        try:
            start_date = datetime.now() - timedelta(days=days)
            
            response = self.supabase.table('orders').select('created_at').eq(
                'restaurant_id', restaurant_id
            ).gte(
                'created_at', start_date.isoformat()
            ).in_(
                'status', ['completed', 'ready', 'preparing']
            ).execute()
            
            orders = response.data if response.data else []
            
            # Analyze by hour of day
            hourly_orders = defaultdict(int)
            daily_orders = defaultdict(int)
            
            for order in orders:
                created_at = order.get('created_at', '')
                if not created_at:
                    continue
                
                try:
                    dt = datetime.fromisoformat(created_at.replace('Z', '+00:00'))
                    hour = dt.hour
                    day_of_week = dt.strftime('%A')
                    
                    hourly_orders[hour] += 1
                    daily_orders[day_of_week] += 1
                except:
                    pass
            
            # Convert to lists
            hourly_data = [
                {'hour': hour, 'orders': count}
                for hour, count in sorted(hourly_orders.items())
            ]
            
            # Day of week order (Monday-Sunday)
            day_order = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
            daily_data = [
                {'day': day, 'orders': daily_orders.get(day, 0)}
                for day in day_order
            ]
            
            # Find peak times
            peak_hour = max(hourly_orders.items(), key=lambda x: x[1])[0] if hourly_orders else 12
            peak_day = max(daily_orders.items(), key=lambda x: x[1])[0] if daily_orders else 'Friday'
            
            return {
                'success': True,
                'period_days': days,
                'hourly_distribution': hourly_data,
                'daily_distribution': daily_data,
                'peak_times': {
                    'hour': peak_hour,
                    'day': peak_day
                }
            }
            
        except Exception as e:
            print(f"❌ Error getting order trends: {str(e)}")
            return {
                'success': False,
                'error': str(e)
            }


# Import os at the top
import os

# Create singleton instance
analytics_service = AnalyticsService()

