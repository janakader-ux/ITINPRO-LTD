# ITIN Pro website

Production-ready static website source for [itinpro.uk](https://itinpro.uk/).

## Flat repository structure

Every deployable file is intentionally stored at the repository root. There are no `assets`, `blog` or `css` subfolders, preventing GitHub's web uploader from losing or flattening directories.

- `index.html` — homepage
- `smart-itin-form.html` — client enquiry form
- `itin-document-rules.html` — document verification guidance
- `itin-guides.html` — complete guide-library index
- Individual guide `.html` files — reviewed SEO article set
- Logo `.svg` and `.png` files — website and email assets
- `styles.css` and `claude-guides.css` — responsive styles
- `robots.txt` and `sitemap.xml` — search-engine files
- `.htaccess` and `404.html` — Hostinger/Apache configuration

No build command or package installation is required. The repository files are the deployable website.

## Deploy through GitHub to Hostinger

1. Create a GitHub repository, for example `itinpro-website`.
2. Upload **all extracted files together** to the repository root. `index.html` must be at the root. No folders need to be uploaded.
3. Commit the files to the `main` branch.
4. In Hostinger hPanel, open **Websites → itinpro.uk → Dashboard → Advanced → Git**.
5. Add the GitHub repository URL and select the `main` branch.
6. Set the deployment directory to `/public_html` for the main domain.
7. For a private repository, add the SSH key supplied by Hostinger in **GitHub → Repository Settings → Deploy keys**, with read access.
8. Select **Deploy** and enable automatic deployment/webhook if Hostinger offers it.
9. Open `https://itinpro.uk/`, test navigation and send a test enquiry.
10. Submit `https://itinpro.uk/sitemap.xml` in Google Search Console.

## Updating the website

Edit the relevant file in GitHub, commit to `main`, then redeploy from Hostinger Git. With automatic deployment enabled, each new commit should deploy automatically.

## Contact configuration

- Primary: Thasneem Alzari (Taz) CAA — `Taz@itinpro.uk` — `+44 7864 113967`
- Additional contact: Shan — `Shan@itinpro.uk` — `+44 7864 999586`

The Smart ITIN Form currently opens the visitor's email application and sends the enquiry to Taz. It does not upload passports or identity documents. Add a secure server-side form or CRM before accepting confidential files online.

## Combined-package decision

This all-in-one release keeps the tested ITIN Pro homepage, logo, contact information, document guidance and low-risk email enquiry form. It also includes the useful Claude SEO article library after removing broken links, placeholder company/ICO wording and unconfirmed fixed-fee claims.

The experimental PHP passport-upload, admin-login and SumUp checkout code from the Claude package is intentionally not active in this release. It required live credentials, professional security testing, confirmed privacy/retention wording and reviewed engagement terms before it could safely process identity documents or payments.

## Compliance

ITIN Pro is presented as an independent service and not as the IRS. The website deliberately avoids official IRS seals, logos and endorsement claims.
