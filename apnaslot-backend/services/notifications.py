from models import User, Provider, Slot

def send_booking_confirmation(user: User, provider: Provider, slot: Slot):
    print(f"✅ Booking confirmed for {user.name} at {provider.name} on {slot.date} at {slot.start_time}")

def send_reminder(user: User, provider: Provider, slot: Slot, hours_before: int):
    print(f"🔔 Reminder: {user.name}, your appointment at {provider.name} is in {hours_before} hours")
