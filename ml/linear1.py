
# THIS WAS NOT RUNNING SINCE MICROSOFT EDGE DRIVER 
# WAS NOT GETTING INSTALLED AUTOMATICALLY
# SO I DOWNLOADED THE DRIVER WITH VERSION MATCHING TO  EDGE
# AND THEN ADDED IT TO THE PATH C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedgedriver.exe
# AND MADE CERTAIN CHANGES IN THE CODE ACCORDINGLY

from selenium import webdriver
from selenium.webdriver.common.by import By
from selenium.webdriver.edge.service import Service
from selenium.webdriver.edge.options import Options
from selenium.webdriver.common.action_chains import ActionChains
import time
import random
import os



def inject_visual_cursor(driver):
    cursor_js = """
    var cursor = document.createElement('div');
    cursor.id = 'selenium-cursor';
    cursor.style.width = '20px';
    cursor.style.height = '20px';
    cursor.style.borderRadius = '50%';
    cursor.style.backgroundColor = 'red';
    cursor.style.position = 'absolute';
    cursor.style.zIndex = '9999';
    cursor.style.pointerEvents = 'none';
    cursor.style.transition = 'left 0.05s, top 0.05s'; // Add smooth transition
    document.body.appendChild(cursor);

    window.moveCursor = function(x, y) {
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
    };
    """
    driver.execute_script(cursor_js)

def update_cursor_position(driver, x, y):
    """Update the position of the visual cursor"""
    driver.execute_script(f"window.moveCursor({x}, {y});")

def custom_move_by_offset(driver, actions, from_x, from_y, to_x, to_y, steps=10):
    """Move the cursor from (from_x, from_y) to (to_x, to_y) with visual cursor updates"""
    dx = to_x - from_x
    dy = to_y - from_y
    
    for i in range(1, steps + 1):
        ratio = i / steps
        current_x = from_x + dx * ratio
        current_y = from_y + dy * ratio
        
        # Move selenium's cursor
        actions.move_by_offset(dx/steps, dy/steps).perform()
        
        # Update the visual cursor
        update_cursor_position(driver, current_x, current_y)
        
        # Small delay to make movement visible
        time.sleep(0.02)
    
    return to_x, to_y

def bot_simulation():
    # Direct path to Edge driver (place msedgedriver.exe in this location)
    driver_path = "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedgedriver.exe"
    
    # Check if driver exists
    if not os.path.exists(driver_path):
        print(f"Edge driver not found at: {driver_path}")
        print("Please download msedgedriver.exe and place it in that location.")
        print("Download from: https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/")
        return
    
    print(f"Using Edge driver at: {driver_path}")
    
    # Setup Edge options
    edge_options = Options()
    
    # Optional: Uncomment if you want to run without GUI
    # edge_options.add_argument("--headless")
    
    # Optional: Uncomment if you need to test with localhost/local development
    # edge_options.add_argument("--disable-web-security")
    # edge_options.add_argument("--allow-running-insecure-content")
    
    # Initialize the Edge driver with local path
    try:
        service = Service(driver_path)
        driver = webdriver.Edge(service=service, options=edge_options)
    except Exception as e:
        print(f"Failed to initialize Edge driver: {e}")
        print("Please check if the Edge driver is compatible with your Edge browser version.")
        return
    
    try:
        # Navigate to your local page - update the path as needed
        driver.get("http://localhost:3000/home")
        driver.maximize_window()
        
        # Get window dimensions
        window_width = driver.execute_script("return window.innerWidth")
        window_height = driver.execute_script("return window.innerHeight")
        
        # Create ActionChains for mouse movements
        actions = ActionChains(driver)
        
        # Initialize visual cursor after page load
        inject_visual_cursor(driver)
        
        # Reset cursor position
        current_x, current_y = 0, 0
        update_cursor_position(driver, current_x, current_y)
        
        # BOT BEHAVIOR: Direct linear movement to phone input field
        print("Simulating bot behavior: Direct linear movement")
        
        # Find the phone input field
        phone_input = driver.find_element(By.ID, "phone")
        
        # Get the center coordinates of the phone input field
        phone_rect = phone_input.rect
        target_x = phone_rect['x'] + phone_rect['width'] / 2
        target_y = phone_rect['y'] + phone_rect['height'] / 2
        
        # Move directly to the phone input in a straight line with visible cursor
        print(f"Moving to phone input at ({target_x}, {target_y})")
        current_x, current_y = custom_move_by_offset(driver, actions, current_x, current_y, target_x, target_y, steps=20)
        time.sleep(0.5)
        
        # Enter phone number
        phone_input.click()
        for digit in "987654321024":
            phone_input.send_keys(digit)
            time.sleep(random.uniform(0.1, 0.2))  # Vary typing speed slightly
        time.sleep(0.5)
        
        # Find and click the send OTP button
        send_otp_button = driver.find_element(By.ID, "sendOtp")
        send_otp_rect = send_otp_button.rect
        send_x = send_otp_rect['x'] + send_otp_rect['width'] / 2
        send_y = send_otp_rect['y'] + send_otp_rect['height'] / 2
        
        # Move to send OTP button with visible cursor
        print(f"Moving to Send OTP button at ({send_x}, {send_y})")
        current_x, current_y = custom_move_by_offset(driver, actions, current_x, current_y, send_x, send_y, steps=15)
        time.sleep(0.3)
        
        send_otp_button.click()
        time.sleep(2)
        
        # Find the OTP input field
        otp_input = driver.find_element(By.ID, "otp")
        otp_rect = otp_input.rect
        otp_x = otp_rect['x'] + otp_rect['width'] / 2
        otp_y = otp_rect['y'] + otp_rect['height'] / 2
        
        # Move to OTP input with visible cursor
        print(f"Moving to OTP input at ({otp_x}, {otp_y})")
        current_x, current_y = custom_move_by_offset(driver, actions, current_x, current_y, otp_x, otp_y, steps=15)
        time.sleep(0.3)
        
        # Enter OTP
        otp_input.click()
        for digit in "12456":
            otp_input.send_keys(digit)
            time.sleep(random.uniform(0.1, 0.2))  # Vary typing speed slightly
        time.sleep(0.5)
        
        # Find and click the verify button
        verify_button = driver.find_element(By.XPATH, "//button[contains(text(), 'Verify')]")
        verify_rect = verify_button.rect
        verify_x = verify_rect['x'] + verify_rect['width'] / 2
        verify_y = verify_rect['y'] + verify_rect['height'] / 2
        
        # Move to verify button with visible cursor
        print(f"Moving to Verify button at ({verify_x}, {verify_y})")
        current_x, current_y = custom_move_by_offset(driver, actions, current_x, current_y, verify_x, verify_y, steps=15)
        time.sleep(0.3)
        
        verify_button.click()
        
        # Wait to see the result
        time.sleep(3)
        
        print("Bot simulation completed successfully!")
        
    except Exception as e:
        print(f"An error occurred during simulation: {e}")
        
    finally:
        # Close the browser
        driver.quit()

if __name__ == "__main__":
    bot_simulation()