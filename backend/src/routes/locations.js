const express = require('express');
const { PrismaClient } = require('@prisma/client');
const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const districts = await prisma.locationDistrict.findMany({
      include: {
        talukas: {
          include: {
            villages: true
          }
        }
      }
    });
    res.json(districts);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch locations' });
  }
});

module.exports = router;
