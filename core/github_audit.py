import re
from typing import Dict, List, Optional
from urllib import request, error
import json


class GitHubAudit:
    """Audit smart contracts from GitHub repositories."""
    
    def __init__(self, token: Optional[str] = None):
        self.token = token
        self.api_base = "https://api.github.com"
        self.headers = {
            "Accept": "application/vnd.github.v3+json",
            "User-Agent": "SWARMs-Debate-Primitive"
        }
        if self.token:
            self.headers["Authorization"] = f"token {self.token}"
    
    def get_repo_files(self, owner: str, repo: str, path: str = "", extension: str = ".sol") -> List[Dict]:
        """Get all files with a specific extension from a repository."""
        url = f"{self.api_base}/repos/{owner}/{repo}/contents/{path}"
        try:
            req = request.Request(url, headers=self.headers, method="GET")
            with request.urlopen(req, timeout=30) as response:
                data = json.loads(response.read().decode("utf-8"))
            
            files = []
            if isinstance(data, list):
                for item in data:
                    if item["type"] == "file" and item["name"].endswith(extension):
                        files.append({
                            "name": item["name"],
                            "path": item["path"],
                            "url": item["download_url"]
                        })
                    elif item["type"] == "dir":
                        files.extend(self.get_repo_files(owner, repo, item["path"], extension))
            return files
        except Exception as e:
            print(f"Error fetching repo files: {e}")
            return []
    
    def get_file_content(self, url: str) -> str:
        """Get the content of a file from its download URL."""
        try:
            req = request.Request(url, headers=self.headers, method="GET")
            with request.urlopen(req, timeout=30) as response:
                return response.read().decode("utf-8")
        except Exception as e:
            print(f"Error fetching file content: {e}")
            return ""
    
    def analyze_solidity_contract(self, code: str) -> Dict:
        """Analyze a Solidity smart contract for common vulnerabilities."""
        vulnerabilities = []
        
        # Check for missing access control
        if re.search(r"function\s+\w+\s*\([^)]*\)\s*(public|external)\s*(?!.*onlyOwner|.*require\(msg\.sender|.*accessControl)", code, re.IGNORECASE):
            vulnerabilities.append({
                "severity": "HIGH",
                "type": "Missing Access Control",
                "description": "Function lacks proper access control modifiers"
            })
        
        # Check for reentrancy vulnerability
        if re.search(r"\.call\s*\{.*value\s*:", code) or re.search(r"\.send\s*\(", code):
            if not re.search(r"nonReentrant", code):
                vulnerabilities.append({
                    "severity": "HIGH",
                    "type": "Reentrancy",
                    "description": "Potential reentrancy vulnerability detected"
                })
        
        # Check for unchecked return values
        if re.search(r"\.(call|send|transfer)\s*\([^)]*\)\s*;", code):
            vulnerabilities.append({
                "severity": "MEDIUM",
                "type": "Unchecked Return Value",
                "description": "External call return value not checked"
            })
        
        # Check for integer overflow/underflow (Solidity < 0.8.0)
        if re.search(r"pragma\s+solidity\s+[^;]*\^0\.7", code):
            vulnerabilities.append({
                "severity": "MEDIUM",
                "type": "Integer Overflow/Underflow",
                "description": "Solidity version < 0.8.0 may be vulnerable to integer overflow"
            })
        
        # Check for front-running
        if re.search(r"block\.timestamp|block\.number", code):
            vulnerabilities.append({
                "severity": "LOW",
                "type": "Front-running",
                "description": "Uses block timestamp or number which can be manipulated"
            })
        
        # Check for hardcoded addresses
        if re.search(r"0x[a-fA-F0-9]{40}", code):
            vulnerabilities.append({
                "severity": "LOW",
                "type": "Hardcoded Address",
                "description": "Contains hardcoded addresses"
            })
        
        return {
            "vulnerabilities": vulnerabilities,
            "severity_score": self._calculate_severity_score(vulnerabilities)
        }
    
    def analyze_rust_contract(self, code: str) -> Dict:
        """Analyze a Rust/Anchor smart contract for common vulnerabilities."""
        vulnerabilities = []
        
        # Check for missing owner checks
        if re.search(r"pub\s+fn\s+\w+", code) and not re.search(r"require!\(.*ctx\.accounts\.owner\.key\(\)", code):
            vulnerabilities.append({
                "severity": "HIGH",
                "type": "Missing Owner Check",
                "description": "Public function lacks owner authorization check"
            })
        
        # Check for unchecked arithmetic
        if re.search(r"\+\+|--|\+=|-=|\*=|/=", code):
            vulnerabilities.append({
                "severity": "MEDIUM",
                "type": "Unchecked Arithmetic",
                "description": "Arithmetic operations without overflow checks"
            })
        
        # Check for direct lamport manipulation
        if re.search(r"\*\*.*\.try_borrow_mut_lamports\(\)", code):
            vulnerabilities.append({
                "severity": "HIGH",
                "type": "Direct Lamport Manipulation",
                "description": "Direct manipulation of lamports without proper checks"
            })
        
        return {
            "vulnerabilities": vulnerabilities,
            "severity_score": self._calculate_severity_score(vulnerabilities)
        }
    
    def _calculate_severity_score(self, vulnerabilities: List[Dict]) -> float:
        """Calculate a severity score from vulnerabilities."""
        if not vulnerabilities:
            return 0.0
        
        score = 0.0
        for vuln in vulnerabilities:
            if vuln["severity"] == "HIGH":
                score += 10
            elif vuln["severity"] == "MEDIUM":
                score += 5
            elif vuln["severity"] == "LOW":
                score += 2
        
        return min(score / 30.0 * 100, 100)  # Normalize to 0-100
    
    def audit_repository(self, owner: str, repo: str) -> Dict:
        """Audit a GitHub repository for smart contract vulnerabilities."""
        print(f"Auditing repository: {owner}/{repo}")
        
        # Get Solidity files
        sol_files = self.get_repo_files(owner, repo, "", ".sol")
        print(f"Found {len(sol_files)} Solidity files")
        
        # Get Rust files
        rust_files = self.get_repo_files(owner, repo, "", ".rs")
        print(f"Found {len(rust_files)} Rust files")
        
        results = {
            "repository": f"{owner}/{repo}",
            "solidity_files": [],
            "rust_files": [],
            "total_vulnerabilities": 0,
            "overall_severity": 0.0
        }
        
        # Analyze Solidity files
        for file in sol_files[:5]:  # Limit to first 5 files
            content = self.get_file_content(file["url"])
            if content:
                analysis = self.analyze_solidity_contract(content)
                results["solidity_files"].append({
                    "name": file["name"],
                    "path": file["path"],
                    "analysis": analysis
                })
                results["total_vulnerabilities"] += len(analysis["vulnerabilities"])
        
        # Analyze Rust files
        for file in rust_files[:5]:  # Limit to first 5 files
            content = self.get_file_content(file["url"])
            if content:
                analysis = self.analyze_rust_contract(content)
                results["rust_files"].append({
                    "name": file["name"],
                    "path": file["path"],
                    "analysis": analysis
                })
                results["total_vulnerabilities"] += len(analysis["vulnerabilities"])
        
        # Calculate overall severity
        total_files = len(results["solidity_files"]) + len(results["rust_files"])
        if total_files > 0:
            total_severity = sum(
                f["analysis"]["severity_score"] 
                for f in results["solidity_files"] + results["rust_files"]
            )
            results["overall_severity"] = total_severity / total_files
        
        return results
    
    def generate_audit_prompt(self, audit_result: Dict) -> str:
        """Generate a prompt for the debate agents based on audit results."""
        prompt = f"SMART CONTRACT AUDIT: {audit_result['repository']}\n\n"
        
        if audit_result["solidity_files"]:
            prompt += f"Solidity Files Analyzed: {len(audit_result['solidity_files'])}\n"
            for file in audit_result["solidity_files"]:
                prompt += f"\n- {file['name']}:\n"
                for vuln in file["analysis"]["vulnerabilities"]:
                    prompt += f"  [{vuln['severity']}] {vuln['type']}: {vuln['description']}\n"
        
        if audit_result["rust_files"]:
            prompt += f"\nRust Files Analyzed: {len(audit_result['rust_files'])}\n"
            for file in audit_result["rust_files"]:
                prompt += f"\n- {file['name']}:\n"
                for vuln in file["analysis"]["vulnerabilities"]:
                    prompt += f"  [{vuln['severity']}] {vuln['type']}: {vuln['description']}\n"
        
        prompt += f"\nOverall Severity Score: {audit_result['overall_severity']:.1f}/100"
        prompt += "\n\nShould this repository be deployed to mainnet? Analyze the vulnerabilities and provide a recommendation."
        
        return prompt


# Example usage
if __name__ == "__main__":
    auditor = GitHubAudit()
    # result = auditor.audit_repository("owner", "repo")
    # print(auditor.generate_audit_prompt(result))
