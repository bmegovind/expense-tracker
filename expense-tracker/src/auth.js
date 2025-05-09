# Create and write auth.js
echo '// Initialize Netlify Identity
export function initAuth() {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on("init", user => {
            if (user) {
                document.getElementById('\''app-content'\'').classList.remove('\''hidden'\'');
                updateAuthUI();
            }
        });
        
        window.netlifyIdentity.on("login", user => {
            document.getElementById('\''app-content'\'').classList.remove('\''hidden'\'');
            updateAuthUI();
            document.getElementById('\''auth-modal'\'').classList.add('\''hidden'\'');
            window.location.reload();
        });
        
        window.netlifyIdentity.on("logout", () => {
            document.getElementById('\''app-content'\'').classList.add('\''hidden'\'');
            updateAuthUI();
        });
        
        // Open modal when auth button clicked
        document.getElementById('\''auth-button'\'').addEventListener('\''click'\'', () => {
            const modal = document.getElementById('\''auth-modal'\'');
            modal.classList.remove('\''hidden'\'');
        });
        
        // Close modal
        document.querySelector('\''.close'\'').addEventListener('\''click'\'', () => {
            document.getElementById('\''auth-modal'\'').classList.add('\''hidden'\'');
        });
    }
    
    // Set current year
    document.getElementById('\''current-year'\'').textContent = new Date().getFullYear();
}

// Update UI based on auth state
export function updateAuthUI() {
    const user = netlifyIdentity.currentUser();
    const authButton = document.getElementById('\''auth-button'\'');
    const userEmail = document.getElementById('\''user-email'\'');
    
    if (user) {
        userEmail.textContent = user.email;
        authButton.textContent = '\''Logout'\'';
        authButton.onclick = () => {
            netlifyIdentity.logout();
        };
    } else {
        userEmail.textContent = '\'''\'';
        authButton.textContent = '\''Login'\'';
        authButton.onclick = () => {
            document.getElementById('\''auth-modal'\'').classList.remove('\''hidden'\'');
        };
    }
}

// Check if user is authenticated
export function isAuthenticated() {
    return netlifyIdentity.currentUser() !== null;
}

// Get current user ID
export function getUserId() {
    const user = netlifyIdentity.currentUser();
    return user ? user.id : null;
}' > src/auth.js

# Create and write expenses.js
echo 'import { isAuthenticated, getUserId } from '\''./auth.js'\'';

// Expense data storage
let expenses = [];

// DOM Elements
const expenseForm = document.getElementById('\''expense-form'\'');
const expensesBody = document.getElementById('\''expenses-body'\'');
const totalAmountCell = document.getElementById('\''total-amount'\'');
const totalLunchCell = document.getElementById('\''total-lunch'\'');
const totalKmsCell = document.getElementById('\''total-kms'\'');
const exportPdfBtn = document.getElementById('\''export-pdf'\'');
const exportExcelBtn = document.getElementById('\''export-excel'\'');

// Initialize expenses
export async function initExpenses() {
    if (!isAuthenticated()) return;
    
    await loadExpenses();
    setupEventListeners();
}

// Load expenses from backend
async function loadExpenses() {
    try {
        const response = await fetch('\''/.netlify/functions/get-expenses'\'', {
            headers: {
                '\''Authorization'\'': \`Bearer \${netlifyIdentity.currentUser().token.access_token}\`
            }
        });
        const data = await response.json();
        
        if (response.ok) {
            expenses = data[0]?.data?.expenses || [];
            renderExpenses();
        } else {
            console.error('\''Error loading expenses:'\'', data);
        }
    } catch (error) {
        console.error('\''Error loading expenses:'\'', error);
    }
}

// Save expenses to backend
async function saveExpenses() {
    try {
        const response = await fetch('\''/.netlify/functions/save-expenses'\'', {
            method: '\''POST'\'',
            body: JSON.stringify({ expenses }),
            headers: {
                '\''Content-Type'\'': '\''application/json'\'',
                '\''Authorization'\'': \`Bearer \${netlifyIdentity.currentUser().token.access_token}\`
            }
        });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || '\''Failed to save expenses'\'');
        }
    } catch (error) {
        console.error('\''Error saving expenses:'\'', error);
    }
}

// Render expenses in the table
function renderExpenses() {
    expensesBody.innerHTML = '\'''\'';
    
    let totalAmount = 0;
    let totalLunch = 0;
    let totalKms = 0;
    
    expenses.forEach((expense, index) => {
        const row = document.createElement('\''tr'\'');
        
        // Calculate totals
        totalAmount += expense.amount || 0;
        totalLunch += expense.lunch || 0;
        totalKms += expense.kms || 0;
        
        row.innerHTML = \`
            <td>\${formatDate(expense.date)}</td>
            <td>\${expense.from || '\'''\''}</td>
            <td>\${expense.to || '\'''\''}</td>
            <td>\${expense.mode || '\'''\''}</td>
            <td>\${expense.reason || '\'''\''}</td>
            <td>\${expense.customer || '\'''\''}</td>
            <td>\${expense.amount ? '\''₹'\'' + expense.amount.toFixed(2) : '\'''\''}</td>
            <td>\${expense.lunch ? '\''₹'\'' + expense.lunch.toFixed(2) : '\'''\''}</td>
            <td>\${expense.kms ? expense.kms + '\'' km'\'' : '\'''\''}</td>
            <td class="action-buttons">
                <button class="btn btn-danger" data-index="\${index}">Delete</button>
            </td>
        \`;
        
        expensesBody.appendChild(row);
    });
    
    // Update totals
    totalAmountCell.textContent = '\''₹'\'' + totalAmount.toFixed(2);
    totalLunchCell.textContent = '\''₹'\'' + totalLunch.toFixed(2);
    totalKmsCell.textContent = totalKms.toFixed(1) + '\'' km'\'';
}

// Format date for display
function formatDate(dateString) {
    if (!dateString) return '\'''\'';
    const date = new Date(dateString);
    return date.toLocaleDateString('\''en-GB'\''); // DD/MM/YYYY format
}

// Add event listeners
function setupEventListeners() {
    // Form submission
    expenseForm.addEventListener('\''submit'\'', async function(e) {
        e.preventDefault();
        
        const expense = {
            date: document.getElementById('\''date'\'').value,
            from: document.getElementById('\''from'\'').value,
            to: document.getElementById('\''to'\'').value,
            mode: document.getElementById('\''mode'\'').value,
            reason: document.getElementById('\''reason'\'').value,
            customer: document.getElementById('\''customer'\'').value,
            amount: parseFloat(document.getElementById('\''amount'\'').value) || 0,
            lunch: parseFloat(document.getElementById('\''lunch'\'').value) || 0,
            kms: parseFloat(document.getElementById('\''kms'\'').value) || 0
        };
        
        expenses.push(expense);
        await saveExpenses();
        renderExpenses();
        expenseForm.reset();
    });
    
    // Delete expense
    expensesBody.addEventListener('\''click'\'', async function(e) {
        if (e.target.classList.contains('\''btn-danger'\'')) {
            const index = e.target.getAttribute('\''data-index'\'');
            if (confirm('\''Are you sure you want to delete this expense?'\'')) {
                expenses.splice(index, 1);
                await saveExpenses();
                renderExpenses();
            }
        }
    });
    
    // Export to PDF
    exportPdfBtn.addEventListener('\''click'\'', exportToPdf);
    
    // Export to Excel
    exportExcelBtn.addEventListener('\''click'\'', exportToExcel);
}

// Export to PDF function
function exportToPdf() {
    // Create a new jsPDF instance
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();
    
    // Add title
    doc.setFontSize(18);
    doc.text('\''Expense Report'\'', 105, 15, { align: '\''center'\'' });
    
    // Add user info
    doc.setFontSize(12);
    doc.text(\`User: \${netlifyIdentity.currentUser().email}\`, 14, 25);
    doc.text(\`Generated on: \${new Date().toLocaleDateString()}\`, 105, 25, { align: '\''center'\'' });
    
    // Create table data
    const headers = [
        "Date", 
        "From", 
        "To", 
        "Mode", 
        "Details", 
        "Customer", 
        "Amount", 
        "Lunch", 
        "Kms"
    ];
    
    const data = expenses.map(expense => [
        formatDate(expense.date),
        expense.from || '\'''\'',
        expense.to || '\'''\'',
        expense.mode || '\'''\'',
        expense.reason || '\'''\'',
        expense.customer || '\'''\'',
        expense.amount ? '\''₹'\'' + expense.amount.toFixed(2) : '\'''\'',
        expense.lunch ? '\''₹'\'' + expense.lunch.toFixed(2) : '\'''\'',
        expense.kms ? expense.kms + '\'' km'\'' : '\'''\''
    ]);
    
    // Calculate totals
    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalLunch = expenses.reduce((sum, e) => sum + (e.lunch || 0), 0);
    const totalKms = expenses.reduce((sum, e) => sum + (e.kms || 0), 0);
    
    data.push([
        '\'''\'', '\'''\'', '\'''\'', '\'''\'', '\'''\'', '\''Total:'\'',
        '\''₹'\'' + totalAmount.toFixed(2),
        '\''₹'\'' + totalLunch.toFixed(2),
        totalKms.toFixed(1) + '\'' km'\''
    ]);
    
    // Generate the table
    doc.autoTable({
        head: [headers],
        body: data,
        startY: 35,
        styles: {
            fontSize: 10,
            cellPadding: 3,
            overflow: '\''linebreak'\''
        },
        columnStyles: {
            0: { cellWidth: 20 },
            1: { cellWidth: 20 },
            2: { cellWidth: 20 },
            3: { cellWidth: 15 },
            4: { cellWidth: 30 },
            5: { cellWidth: 25 },
            6: { cellWidth: 15 },
            7: { cellWidth: 15 },
            8: { cellWidth: 15 }
        },
        margin: { top: 30 }
    });
    
    // Save the PDF
    doc.save('\''expense-report.pdf'\'');
}

// Export to Excel function
function exportToExcel() {
    // Create a new workbook
    const wb = XLSX.utils.book_new();
    
    // Prepare data for worksheet
    const headers = [
        "Date", 
        "From", 
        "To", 
        "Mode", 
        "Details", 
        "Customer", 
        "Amount", 
        "Lunch", 
        "Kms"
    ];
    
    const data = expenses.map(expense => ({
        "Date": formatDate(expense.date),
        "From": expense.from || '\'''\'',
        "To": expense.to || '\'''\'',
        "Mode": expense.mode || '\'''\'',
        "Details": expense.reason || '\'''\'',
        "Customer": expense.customer || '\'''\'',
        "Amount": expense.amount || 0,
        "Lunch": expense.lunch || 0,
        "Kms": expense.kms || 0
    }));
    
    // Calculate totals
    const totalAmount = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const totalLunch = expenses.reduce((sum, e) => sum + (e.lunch || 0), 0);
    const totalKms = expenses.reduce((sum, e) => sum + (e.kms || 0), 0);
    
    // Add totals row
    data.push({
        "Date": '\'''\'',
        "From": '\'''\'',
        "To": '\'''\'',
        "Mode": '\'''\'',
        "Details": '\'''\'',
        "Customer": '\''Total:'\'',
        "Amount": totalAmount,
        "Lunch": totalLunch,
        "Kms": totalKms
    });
    
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(data, { headers });
    
    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, "Expenses");
    
    // Generate Excel file and download
    XLSX.writeFile(wb, "expense-report.xlsx");
}' > src/expenses.js

# Create and write app.js
echo 'import { initAuth, updateAuthUI } from '\''./auth.js'\'';
import { initExpenses } from '\''./expenses.js'\'';

// Initialize the application
function initApp() {
    initAuth();
    
    // Check auth state on load
    if (netlifyIdentity.currentUser()) {
        document.getElementById('\''app-content'\'').classList.remove('\''hidden'\'');
        initExpenses();
    }
    
    updateAuthUI();
}

// Wait for Netlify Identity to load
document.addEventListener('\''DOMContentLoaded'\'', () => {
    if (window.netlifyIdentity) {
        window.netlifyIdentity.on('\''init'\'', initApp);
    } else {
        console.error('\''Netlify Identity not loaded'\'');
    }
});' > src/app.js
