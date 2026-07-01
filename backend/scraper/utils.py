from bs4 import BeautifulSoup

def parse_result_html(html):
    """
    Extracts MSBTE result data from the HTML page.
    """

    soup = BeautifulSoup(html, "html.parser")
    result = {}

    # -----------------------------
    # STUDENT DETAILS TABLE
    # -----------------------------
    try:
        student_table = soup.find("table", {"id": "ctl00_ContentPlaceHolder1_grdStudentDetails"})
        if student_table:
            rows = student_table.find_all("tr")
            for tr in rows:
                cols = tr.find_all("td")
                if len(cols) >= 2:
                    key = cols[0].get_text(strip=True)
                    value = cols[1].get_text(strip=True)
                    result[key] = value
    except:
        pass

    # -----------------------------
    # MARKSHEET TABLE
    # -----------------------------
    try:
        marks_table = soup.find("table", {"id": "ctl00_ContentPlaceHolder1_grdMarksheet"})
        subjects = []

        if marks_table:
            trs = marks_table.find_all("tr")[1:]  # skip header

            for tr in trs:
                tds = tr.find_all("td")
                if len(tds) < 6:
                    continue
                
                subjects.append({
                    "code": tds[0].get_text(strip=True),
                    "subject": tds[1].get_text(strip=True),
                    "ia": tds[2].get_text(strip=True),
                    "th": tds[3].get_text(strip=True),
                    "pr": tds[4].get_text(strip=True),
                    "total": tds[5].get_text(strip=True),
                })

        result["subjects"] = subjects

    except:
        result["subjects"] = []

    # -----------------------------
    # RESULT SUMMARY (e.g. RESULT: PASS)
    # -----------------------------
    try:
        summary_box = soup.find("span", {"id": "ctl00_ContentPlaceHolder1_lblResult"})
        if summary_box:
            result["final_result"] = summary_box.get_text(strip=True)
    except:
        pass

    return result