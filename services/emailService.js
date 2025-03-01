// services/emailService.js
const logger = require('../utils/logger');

/**
 * Send ticket confirmation email
 * @param {Object} ticket - Ticket object with passenger and flight details
 * @returns {Promise<boolean>} Success status
 */
exports.sendTicketConfirmation = async (ticket) => {
  try {
    // In a real implementation, this would use a proper email library
    // like nodemailer, SendGrid, etc.
    logger.info(`Sending ticket confirmation to ${ticket.passenger_name} for flight ${ticket.flight_number}`);
    
    // Mock email content
    const emailContent = {
      to: ticket.passenger_email,
      subject: `Booking Confirmation - Flight ${ticket.flight_number}`,
      text: `
        Dear ${ticket.passenger_name},
        
        Thank you for booking with our airline. Here are your flight details:
        
        Flight: ${ticket.flight_number}
        From: ${ticket.origin}
        To: ${ticket.destination}
        Date: ${new Date(ticket.departure_time).toLocaleDateString()}
        Time: ${new Date(ticket.departure_time).toLocaleTimeString()}
        Seat: ${ticket.seat_number}
        Class: ${ticket.class}
        
        Please arrive at the airport at least 2 hours before your flight.
        
        Safe travels!
      `
    };
    
    // Mock successful email sending
    logger.info(`Email confirmation sent to ${ticket.passenger_name}`);
    return true;
  } catch (error) {
    logger.error(`Error sending confirmation email: ${error.message}`);
    return false;
  }
};

/**
 * Send flight cancellation notification
 * @param {Object} flight - Flight object with details
 * @param {Array} passengers - List of passengers on the flight
 * @returns {Promise<boolean>} Success status
 */
exports.sendFlightCancellation = async (flight, passengers) => {
  try {
    logger.info(`Sending cancellation notices for flight ${flight.flight_number}`);
    
    // In a real implementation, this would send emails to all passengers
    for (const passenger of passengers) {
      // Mock email content
      const emailContent = {
        to: passenger.email,
        subject: `IMPORTANT: Flight ${flight.flight_number} Cancellation`,
        text: `
          Dear ${passenger.first_name} ${passenger.last_name},
          
          We regret to inform you that your flight has been cancelled:
          
          Flight: ${flight.flight_number}
          From: ${flight.origin}
          To: ${flight.destination}
          Originally scheduled for: ${new Date(flight.departure_time).toLocaleDateString()} at ${new Date(flight.departure_time).toLocaleTimeString()}
          
          Please contact our customer service for rebooking options or refund.
          
          We apologize for any inconvenience caused.
        `
      };
      
      logger.info(`Cancellation notice sent to ${passenger.first_name} ${passenger.last_name}`);
    }
    
    return true;
  } catch (error) {
    logger.error(`Error sending cancellation emails: ${error.message}`);
    return false;
  }
};
