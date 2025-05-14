#schemas/ticket.py
from app.models.ticket import TicketBase, TicketDB  # Modifiez cette ligne

class TicketCreate(TicketBase):
    pass

class TicketResponse(TicketDB):
    pass