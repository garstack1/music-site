import re

# Column order from your export (based on the sample data)
# id, name, type, artist, venue, city, country, date, endDate, ticketUrl, affiliateUrl, description, imageUrl, genre, source, sourceId, fingerprint, latitude, longitude, active, createdAt, updatedAt, subGenre, startTime, priceMin, priceMax, priceCurrency, featured, artistWebsite, artistFacebook, artistTwitter, artistInstagram, artistSpotify, artistYoutube, artistTiktok, subscriberOnly, soldOut

# Target order for Supabase:
# id, name, type, artist, venue, city, country, date, endDate, ticketUrl, affiliateUrl, description, imageUrl, genre, subGenre, startTime, priceMin, priceMax, priceCurrency, artistWebsite, artistFacebook, artistTwitter, artistInstagram, artistSpotify, artistYoutube, artistTiktok, source, sourceId, fingerprint, latitude, longitude, active, featured, subscriberOnly, soldOut, createdAt, updatedAt

with open('import_event.sql', 'r') as f:
    lines = f.readlines()

with open('import_event_fixed.sql', 'w') as f:
    for line in lines:
        # Just remove the "public." part for now
        line = line.replace('INSERT INTO public."Event"', 'INSERT INTO "Event"')
        f.write(line)

print(f"Processed {len(lines)} lines")
