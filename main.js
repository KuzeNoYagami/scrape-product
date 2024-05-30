const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');
const { Workbook } = require('exceljs');

async function scrapeAmazonProduct(product, numPages) {
  const products = [];

  for (let page = 1; page <= numPages; page++) {
    const url = `https://www.amazon.com/s?k=${encodeURIComponent(product)}&page=${page}`;
    const response = await axios.get(url);
    const html = response.data;
    const $ = cheerio.load(html);

    $('div.s-result-item').each((index, element) => {
      const title = $(element).find('span.a-size-medium').text().trim();
      const price = $(element).find('span.a-price-whole').text().trim();
      const rating = $(element).find('span.a-icon-alt').text().trim();

      // Get the link to the product's photo
      const photoLink = $(element).find('img.s-image').attr('src');

      products.push({ title, price, rating, photoLink });
    });

    // Show progress zzzz
    const progress = Math.floor((page / numPages) * 100);
    const progressBar = '▌'.repeat(progress) + '▌'.repeat(100 - progress);
    const color = progress >= 50? '\x1b[32m' : '\x1b[33m'; // Green for 50% or more, yellow for less
    console.log(`${color}${progressBar} ${progress}%\x1b[0m`);
    process.stdout.write('\033[0G'); // Move cursor to the beginning of the line
  }

  return products;
}

async function main() {
  const product = process.argv[2];
  const numPages = parseInt(process.argv[3]);

  if (!product ||!numPages) {
    console.error('Please provide a product name and the number of pages to scrape as arguments.');
    process.exit(1);
  }

  console.log(`Scraping Amazon for "${product}"...`);

  try {
    const products = await scrapeAmazonProduct(product, numPages);

    // Create a new Excel workbook
    const workbook = new Workbook();
    const sheet = workbook.addWorksheet('Products');

    // Add column headers
    sheet.columns = [
      { header: 'Product Title', key: 'title' },
      { header: 'Price', key: 'price' },
      { header: 'Rating', key: 'rating' },
      { header: 'Link to Photo', key: 'photoLink' },
    ];

    // Add the product data to the Excel sheet
    products.forEach((product) => {
      sheet.addRow(product);
    });

    // Save the Excel workbook
    workbook.xlsx.writeFile('products.xlsx');

    console.log(`Scraping completed. Results saved to 'products.xlsx'`);
  } catch (error) {
    console.error('Error:', error.message);
  }
}

main();
