import swaggerJsdoc from "swagger-jsdoc";

const options = {
  definition: {
    openapi: "3.0.0",

    info: {
      title: "Dexio AI",

      summary:
        "A full-stack AI chatbot application built with modern web technologies.",

      description:
        "Dexio AI is a real-time chatbot platform that integrates authentication, Socket.IO, and AI-driven conversations. The project effectively demonstrates MERN stack technologies through scalable and interactive real-world chat functionality.",

      contact: {
        name: "Dexio API Main",
        url: "https://www.example.com/support",
        email: "support@example.com",
      },
    },
    components: {
      securitySchemes: {
        cookieAuth: {
          type: "apiKey",
          in: "cookie",
          name: "token",
        },
      },
    },
  },

  apis: ["src/routes/*.js"],
};

const openapiSpecification = swaggerJsdoc(options);

export default openapiSpecification;
