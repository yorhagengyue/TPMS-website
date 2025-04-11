import pandas as pd
import sys
import json
import os
from datetime import datetime

def analyze_excel(excel_path):
    """
    Analyze the Excel file containing student data and attendance records
    """
    try:
        # Check if file exists
        if not os.path.exists(excel_path):
            return {"error": f"File not found: {excel_path}"}
        
        # Read Excel file - try to find the student data sheet
        try:
            # First try to read the file with the first sheet
            df = pd.read_excel(excel_path)
            
            # Check if this contains student data
            expected_columns = ['Name', 'index number', 'Admin No.', 'Email']
            found_columns = [col for col in expected_columns if col in df.columns or any(c.lower() == col.lower() for c in df.columns)]
            
            if not found_columns:
                # Try reading all sheets to find student data
                xl = pd.ExcelFile(excel_path)
                sheet_found = False
                
                for sheet_name in xl.sheet_names:
                    df = pd.read_excel(excel_path, sheet_name=sheet_name)
                    found_columns = [col for col in expected_columns if col in df.columns or any(c.lower() == col.lower() for c in df.columns)]
                    if found_columns:
                        sheet_found = True
                        break
                
                if not sheet_found:
                    return {"error": "No student data found in Excel file"}
        except Exception as e:
            return {"error": f"Error reading Excel file: {str(e)}"}
        
        # Standardize column names (handle different capitalization and naming)
        col_mapping = {}
        for col in df.columns:
            lower_col = col.lower()
            if 'name' in lower_col:
                col_mapping[col] = 'name'
            elif 'index' in lower_col or 'admin' in lower_col and 'no' in lower_col:
                col_mapping[col] = 'index_number'
            elif 'course' in lower_col:
                col_mapping[col] = 'course'
            elif 'email' in lower_col:
                col_mapping[col] = 'email'
        
        # Rename columns
        if col_mapping:
            df = df.rename(columns=col_mapping)
        
        # Ensure required columns exist
        required_cols = ['name', 'index_number']
        missing_cols = [col for col in required_cols if col not in df.columns]
        if missing_cols:
            return {"error": f"Missing required columns: {', '.join(missing_cols)}"}
        
        # Clean up index numbers (remove spaces, convert to lowercase)
        df['index_number'] = df['index_number'].astype(str).str.strip().str.lower()
        
        # Remove rows with missing values in required columns
        df = df.dropna(subset=required_cols)
        
        # Analyze attendance data if available (check for date columns)
        date_columns = [col for col in df.columns if isinstance(col, str) and '/' in col and len(col.split('/')) == 3]
        
        attendance_stats = {}
        if date_columns:
            # Count attendance for each student
            attendance_stats = {}
            for idx, row in df.iterrows():
                student_id = row['index_number']
                attended_dates = []
                
                for date_col in date_columns:
                    # Consider values like '1', 1, 'TRUE', 'Yes', etc. as attended
                    value = str(row[date_col]).lower()
                    if value in ['1', 'true', 'yes', '✓', '✔']:
                        attended_dates.append(date_col)
                
                attendance_stats[student_id] = {
                    'name': row['name'],
                    'total_sessions': len(date_columns),
                    'attended': len(attended_dates),
                    'attendance_rate': round(len(attended_dates) / len(date_columns) * 100, 2) if date_columns else 0,
                    'last_attended': max(attended_dates) if attended_dates else None
                }
        
        # Prepare student data for output
        student_data = []
        for idx, row in df.iterrows():
            student = {
                'name': row['name'],
                'index_number': row['index_number'],
                'course': row['course'] if 'course' in df.columns and not pd.isna(row['course']) else '',
                'email': row['email'] if 'email' in df.columns and not pd.isna(row['email']) else ''
            }
            
            # Add attendance data if available
            if student['index_number'] in attendance_stats:
                student['attendance'] = attendance_stats[student['index_number']]
            
            student_data.append(student)
        
        # Calculate summary statistics
        summary = {
            'total_students': len(student_data),
            'total_sessions': len(date_columns) if date_columns else 0,
            'average_attendance_rate': round(sum(s['attendance']['attendance_rate'] for s in student_data if 'attendance' in s) / len(student_data), 2) if 'attendance' in student_data[0] else 0,
            'analyzed_at': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        }
        
        return {
            'summary': summary,
            'students': student_data
        }
    
    except Exception as e:
        return {"error": f"Error analyzing Excel file: {str(e)}"}

if __name__ == "__main__":
    # Get Excel file path from command line arguments
    if len(sys.argv) < 2:
        print(json.dumps({"error": "Excel file path not provided"}))
        sys.exit(1)
    
    excel_path = sys.argv[1]
    result = analyze_excel(excel_path)
    
    # Output result as JSON
    print(json.dumps(result)) 