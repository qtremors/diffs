# Privacy Policy for Diffs

**Last Updated:** 2026-06-06

Diffs is a personal project built with a privacy-first mindset. This policy explains how the application handles your information.

## 1. No Data Collection

Diffs does not upload file contents, pasted text, comparison results, or fingerprints for processing. The application has no accounts, analytics, usage telemetry, or comparison server. Comparisons run locally in your browser.

## 2. Application and Asset Requests

Your browser requests the application and its supporting assets from the server hosting Diffs. Fonts are local, and PDF support files are served from the same application rather than a third-party CDN. Diffs does not include a service worker or guarantee offline availability.

A hosting provider may receive ordinary connection information, such as your IP address and requested asset paths, and may keep access logs under its own policies. Run Diffs on localhost if you prefer to serve the application from your own machine.

## 3. No Advertisements or Trackers

Diffs contains no advertisements or third-party tracking integrations. Opening a community, source, or other external link takes you to a separate service governed by its own policies.

## 4. Local File Access

Diffs reads files and folders you select or drop into the workspace, along with text you paste or type. Regular files retain their original bytes and SHA-256 fingerprints while they are in the workspace. Folder snapshots keep relative paths, sizes, and hashes; individual file contents are released after hashing.

The application does not modify your source files. Copy and export actions run only when you request them. Exported patches and reports can contain source text, filenames, relative paths, or fingerprints, depending on the comparison. Handle them with the same care as your original files.

## 5. Browser Storage and Reload Recovery

Sessions are temporary by default. Enabling **Remember this tab** saves that tab's workspace, including files, original bytes, pasted text, and source selection, in IndexedDB. A tab identifier and retention preference are stored in sessionStorage. The saved workspace belongs to the site's origin and browser profile; it is not encrypted by Diffs.

Turning retention off or using Reset requests deletion of the current tab's saved record. Check any storage error before relying on deletion. Closing a tab does not guarantee that its IndexedDB record is removed, and duplicating a tab can inherit its session identity. Clear the site's data in browser settings to remove records that are no longer accessible through the app. Clearing site data also removes records from older application versions.

Reload recovery is not a session library, backup, or cross-device synchronization service. Browser storage may be unavailable, evicted, or cleared. Keep independent copies of files you need.

## 6. Source Availability

The source is available for inspection on [GitHub](https://github.com/qtremors/diffs). Usage and distribution are governed by the [Tremors Source License](LICENSE.md).

## 7. Changes to This Policy

This policy may be updated as features change. Changes to application behavior are recorded in the [changelog](CHANGELOG.md). Questions or concerns can be raised through [GitHub Issues](https://github.com/qtremors/diffs/issues); avoid including private files or comparison content in public reports.

---

<p align="center">
  <a href="https://diffs.vercel.app/">Open Diffs</a> · <a href="README.md">Back to README</a>
</p>
