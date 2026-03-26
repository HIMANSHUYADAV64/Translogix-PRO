import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { SubscriptionProvider } from './contexts/SubscriptionContext';
import { VehicleProvider } from './contexts/VehicleContext';
import ProtectedRoute from './components/ProtectedRoute';

// Auth Pages
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import Profile from './pages/Profile';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Feedback from './pages/Feedback';

// Main Pages
import Vehicles from './pages/Vehicles';
import Drivers from './pages/Drivers';
import Maintenance from './pages/Maintenance';
import Tyres from './pages/Tyres';
import Trips from './pages/Trips';
import Payments from './pages/Payments';
import Settings from './pages/Settings';

function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <SubscriptionProvider>
                    <VehicleProvider>
                        <Routes>
                            {/* Public Routes */}
                            <Route path="/login" element={<Login />} />
                            <Route path="/signup" element={<Signup />} />
                            <Route path="/forgot-password" element={<ForgotPassword />} />

                            {/* Protected Routes */}
                            <Route
                                path="/vehicles"
                                element={
                                    <ProtectedRoute>
                                        <Vehicles />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/drivers"
                                element={
                                    <ProtectedRoute>
                                        <Drivers />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/maintenance"
                                element={
                                    <ProtectedRoute>
                                        <Maintenance />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/tyres"
                                element={
                                    <ProtectedRoute>
                                        <Tyres />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/trips"
                                element={
                                    <ProtectedRoute>
                                        <Trips />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/payments"
                                element={
                                    <ProtectedRoute>
                                        <Payments />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/settings"
                                element={
                                    <ProtectedRoute>
                                        <Settings />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/profile"
                                element={
                                    <ProtectedRoute>
                                        <Profile />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/privacy"
                                element={
                                    <ProtectedRoute>
                                        <Privacy />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/terms"
                                element={
                                    <ProtectedRoute>
                                        <Terms />
                                    </ProtectedRoute>
                                }
                            />
                            <Route
                                path="/feedback"
                                element={
                                    <ProtectedRoute>
                                        <Feedback />
                                    </ProtectedRoute>
                                }
                            />

                            {/* Default Redirect */}
                            <Route path="/" element={<Navigate to="/vehicles" replace />} />
                            <Route path="*" element={<Navigate to="/vehicles" replace />} />
                        </Routes>
                    </VehicleProvider>
                </SubscriptionProvider>
            </AuthProvider>
        </BrowserRouter>
    );
}

export default App;
